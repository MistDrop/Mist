var utils       = require('./utils.js'),
	config      = require('./../config.js'),
	schemas     = require('./schemas.js'),
	webhooks    = require('./webhooks.js'),
	krist       = require('./krist.js'),
	addresses   = require('./addresses.js'),
	names       = require('./names.js'),
	tx          = require('./transactions.js'),
	moment      = require('moment');

function Blocks() {}

Blocks.getBlock = function(id) {
	return schemas.block.findById(id);
};

Blocks.getBlocks = function(limit, offset, asc) {
	return schemas.block.findAll({order: 'id' + (asc ? '' : ' DESC'),  limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getBlocksByOrder = function(order, limit, offset) {
	return schemas.block.findAll({order: order, limit: utils.sanitiseLimit(limit), offset: utils.sanitiseOffset(offset)});
};

Blocks.getLastBlock = function() {
	return schemas.block.findOne({order: 'id DESC'});
};

Blocks.getBaseBlockValue = function(blockID) {
	var subsidy = 25;

	if (blockID >= 100000) {
		subsidy = 12;
	}

	return subsidy;
};

Blocks.getBlockValue = function() {
	return new Promise(function(resolve, reject) {
		Blocks.getLastBlock().then(function(lastBlock) {
			names.getUnpaidNameCount().then(function(count) {
				resolve(Blocks.getBaseBlockValue(lastBlock.id) + count);
			}).catch(reject);
		}).catch(reject);
	});
};

Blocks.submit = function(hash, address, nonce) {
	return new Promise(function(resolve, reject) {
		Blocks.getBlockValue().then(function(value) {
			var time = new Date();

			var oldWork = krist.getWork();
			var newWork = Math.round(krist.getWork() * krist.getWorkGrowthFactor());

			console.log('[Krist]'.bold + ' Block submitted by ' + address.toString().bold + ' at ' + moment().format('HH:mm:ss DD/MM/YYYY').toString().cyan + '.');
			console.log('        Current work: ' + newWork.toString().green);

			krist.setWork(newWork);

			schemas.block.create({
				hash: hash,
				address: address,
				nonce: nonce,
				time: time,
				difficulty: oldWork,
				value: value
			}).then(function(block) {
				webhooks.callBlockWebhooks(block);

				addresses.getAddress(address.toLowerCase()).then(function(kristAddress) {
					if (!kristAddress) {
						schemas.address.create({
							address: address.toLowerCase(),
							firstseen: time,
							balance: value,
							totalin: value,
							totalout: 0
						}).then(function(addr) {
							resolve(newWork, addr);
						});

						return;
					}

					kristAddress.increment({ balance: value, totalin: value }).then(function() {
						kristAddress.reload().then(function(updatedAddress) {
							resolve({work: newWork, address: updatedAddress, block: block});
						});
					});
				});

				tx.createTransaction(address, null, value, null, null);

				schemas.name.findAll({ where: { unpaid: { $gt: 0 }}}).then(function(names) {
					names.forEach(function(name) {
						name.decrement({ unpaid: 1 });
					});
				});
			}).catch(reject);
		});
	});
};

module.exports = Blocks;
