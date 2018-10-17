/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an 'AS IS' BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';

var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
//var express = require('express');
//var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
//var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
var hfc = require('fabric-client');
var path = require('path');

var helper = require('./helper.js');
var channels = require('./create-channel.js');
var join = require('./join-channel.js');
var install = require('./install-chaincode.js');
var instantiate = require('./instantiate-chaincode.js');
var invoke = require('./invoke-transaction.js');
var query = require('./query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');
///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// SET CONFIGURATONS ////////////////////////////
///////////////////////////////////////////////////////////////////////////////



hfc.addConfigFile(path.join(__dirname, '../../../env.json'));


/*
app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json());
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));
// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
	secret: 'thisismysecret'
}).unless({
	path: ['/users']
}));
app.use(bearerToken());
app.use(function(req, res, next) {
	if (req.originalUrl.indexOf('/users') >= 0) {
		return next();
	}

	var token = req.token;
	jwt.verify(token, app.get('secret'), function(err, decoded) {
		if (err) {
			res.send({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
			return;
		} else {
			// add the decoded user name and org name to the request object
			// for the downstream code to use
			req.username = decoded.username;
			req.orgname = decoded.orgName;
			logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
			return next();
		}
	});
});

///////////////////////////////////////////////////////////////////////////////
//////////////////////////////// START SERVER /////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
var server = http.createServer(app).listen(port, function() {});
logger.info('****************** SERVER STARTED ************************');
logger.info('**************  http://' + host + ':' + port +
	'  ******************');
server.timeout = 240000;


*/
function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

///////////////////////////////////////////////////////////////////////////////
///////////////////////// REST ENDPOINTS START HERE ///////////////////////////
///////////////////////////////////////////////////////////////////////////////

//try my

// Create Channel
/**
 * Installs a new BusinessNetworkDefinition to the Hyperledger Fabric. The connection must be connected for this method to succeed.
 * @param {express.req} req - the inbound request object from the client
 *  req.body.myArchive: _string - string name of object
 *  req.body.deployOptions: _object - string name of object
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.channel = function(req, res, next) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');

	res.send("it's done");


	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath);
	if (!channelName) {
//		res.json(getErrorMessage('\'channelName\''));
//		return;
	}
	if (!channelConfigPath) {
//		res.json(getErrorMessage('\'channelConfigPath\''));
//		return;
	}

	channels.createChannel(req.body.channelName, req.body.channelConfigPath, req.body.username, req.body.orgName)
	.then(function(message) {
		res.send(message);
	});
};

/**
 * install chaincode
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */

	exports.install = function(req, res, next) {
	logger.debug(
		'\n============ Install chaincode on organizations ============\n');
	helper.setupChaincodeDeploy();



	let org=req.body.org;
	let peers=req.body.peers.split(',');
	////// the peer1 in org1 refers to peer0.org1.exmaple.com /////
	//////while peer2 to peer1.org.example.com, ////////
	///////please install both before instantiate chaincodes///////
	let user=req.body.user;
	let chaincodePath=req.body.chaincodePath;
	//// The buildin path is  $PERSHING/chaincode/src/   /////////
	let chaincodeName=req.body.chaincodeName;
	let chaincodeVersion=req.body.chaincodeVersion;
	var channel = helper.getChannelForOrg(org);
	var client = helper.getClientForOrg(org);

	return helper.getOrgAdmin(org).then((user) => {
		var request = {
			targets: helper.newPeers(peers, org),
			chaincodePath: chaincodePath,
			chaincodeId: chaincodeName,
			chaincodeVersion: chaincodeVersion
		};

		return client.installChaincode(request);
	}, (err) => {
		logger.error('Failed to enroll user \'' + username + '\'. ' + err);
		throw new Error('Failed to enroll user \'' + username + '\'. ' + err);
	}).then((results) => {
		var proposalResponses = results[0];
		var proposal = results[1];
		var all_good = true;
		for (var i in proposalResponses) {
			let one_good = false;
			if (proposalResponses && proposalResponses[i].response &&
				proposalResponses[i].response.status === 200) {
				one_good = true;
				logger.info('install proposal was good');
			} else {
				logger.error('install proposal was bad');
				res.status(400);
				res.send({errorMsg: "bad proposal"});
			}
			all_good = all_good & one_good;
		}

		if (all_good) {
			logger.info(util.format(
				'Successfully sent install Proposal and received ProposalResponse: Status - %s',
				proposalResponses[0].response.status));
			logger.info('\nSuccessfully Installed chaincode on organization ' + org +
				'\n');
//			return 'Successfully Installed chaincode on organization ' + org;
			res.status(200);
			res.send({install: "succeeded"});
		} else {
			logger.error(
				'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
			);
			res.status(401);
//			return 'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...';
      return
		}
	});
};





/**
 * instantiate chaincode
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */

	exports.instantiate = function(req, res, next) {
	logger.debug('\n==================== INSTANTIATE CHAINCODE ==================\n');
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.body.channelName;
	var fcn = req.body.fcn;
  let args=req.body.args.split(',');
	let org=req.body.org;
	let user=req.body.user;


	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	instantiate.instantiateChaincode(channelName, chaincodeName, chaincodeVersion, fcn, args, user, org)
	.then(function(message) {
		res.status(200);
		res.send(message);
	});
};




/**
 * instantiate chaincode
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @function
 */
exports.invoke = function(req, res, next) {
		logger.debug('==================== INVOKE ON CHAINCODE ==================');
		var peers = req.body.peers.split(',');
		var chaincodeName = req.body.chaincodeName;
		var channelName = req.body.channelName;
		var fcn = req.body.fcn;
		let args=req.body.args.split(',');
		let org=req.body.org;
		let user=req.body.user;
		logger.debug('channelName  : ' + channelName);
		logger.debug('chaincodeName : ' + chaincodeName);
		logger.debug('fcn  : ' + fcn);
		logger.debug('args  : ' + args);
		if (!chaincodeName) {
			res.json(getErrorMessage('\'chaincodeName\''));
			return;
		}
		if (!channelName) {
			res.json(getErrorMessage('\'channelName\''));
			return;
		}
		if (!fcn) {
			res.json(getErrorMessage('\'fcn\''));
			return;
		}
		if (!args) {
			res.json(getErrorMessage('\'args\''));
			return;
		}

		invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args,  user, org)
		.then(function(message) {
			res.status(200);
			res.send({txID: message});
		});
	};






	/**
	 * instantiate chaincode
	 * @param {express.req} req - the inbound request object from the client
	 *  req.body.id - the id of the buyer making the request
	 *  req.body.userID - the user id of the buyer in the identity table making this request
	 *  req.body.secret - the pw of this user.
	 * @param {express.res} res - the outbound response object for communicating back to client
	 * @param {express.next} next - an express service to enable post processing prior to responding to the client
	 * @function
	 */
exports.queryChaincode = function(req, res, next) {
		logger.debug('==================== QUERY BY CHAINCODE ==================');
		var channelName = req.query.channelName;
		var chaincodeName = req.query.chaincodeName;
		let args = req.query.args;
		let fcn = req.query.fcn;
		let peer = req.query.peer.split(',');
		let org=req.query.org;
		let user=req.query.user;

		logger.debug('channelName : ' + channelName);
		logger.debug('chaincodeName : ' + chaincodeName);
		logger.debug('fcn : ' + fcn);
		logger.debug('args : ' + args);

		if (!chaincodeName) {
			res.json(getErrorMessage('\'chaincodeName\''));
			return;
		}
		if (!channelName) {
			res.json(getErrorMessage('\'channelName\''));
			return;
		}
		if (!fcn) {
			res.json(getErrorMessage('\'fcn\''));
			return;
		}
		if (!args) {
			res.json(getErrorMessage('\'args\''));
			return;
		}
		args = args.replace(/'/g, '"');
//		args = JSON.parse(args);
		logger.debug(args);

		query.queryChaincode(peer, channelName, chaincodeName, args, fcn, user, org)
		.then(function(message) {
			res.send(message);
		});
	};




/*
	//  Query Get Block by BlockNumber
	app.get('/channels/:channelName/blocks/:blockId', function(req, res) {
		logger.debug('==================== GET BLOCK BY NUMBER ==================');
		let blockId = req.params.blockId;
		let peer = req.query.peer;
		logger.debug('channelName : ' + req.params.channelName);
		logger.debug('BlockID : ' + blockId);
		logger.debug('Peer : ' + peer);
		if (!blockId) {
			res.json(getErrorMessage('\'blockId\''));
			return;
		}

		query.getBlockByNumber(peer, blockId, req.username, req.orgname)
			.then(function(message) {
				res.send(message);
			});
	});
	// Query Get Transaction by Transaction ID
	app.get('/channels/:channelName/transactions/:trxnId', function(req, res) {
		logger.debug(
			'================ GET TRANSACTION BY TRANSACTION_ID ======================'
		);
		logger.debug('channelName : ' + req.params.channelName);
		let trxnId = req.params.trxnId;
		let peer = req.query.peer;
		if (!trxnId) {
			res.json(getErrorMessage('\'trxnId\''));
			return;
		}

		query.getTransactionByID(peer, trxnId, req.username, req.orgname)
			.then(function(message) {
				res.send(message);
			});
	});
	// Query Get Block by Hash
	app.get('/channels/:channelName/blocks', function(req, res) {
		logger.debug('================ GET BLOCK BY HASH ======================');
		logger.debug('channelName : ' + req.params.channelName);
		let hash = req.query.hash;
		let peer = req.query.peer;
		if (!hash) {
			res.json(getErrorMessage('\'hash\''));
			return;
		}

		query.getBlockByHash(peer, hash, req.username, req.orgname).then(
			function(message) {
				res.send(message);
			});
	});
	//Query for Channel Information
	app.get('/channels/:channelName', function(req, res) {
		logger.debug(
			'================ GET CHANNEL INFORMATION ======================');
		logger.debug('channelName : ' + req.params.channelName);
		let peer = req.query.peer;

		query.getChainInfo(peer, req.username, req.orgname).then(
			function(message) {
				res.send(message);
			});
	});
	// Query to fetch all Installed/instantiated chaincodes
	app.get('/chaincodes', function(req, res) {
		var peer = req.query.peer;
		var installType = req.query.type;
		//TODO: add Constnats
		if (installType === 'installed') {
			logger.debug(
				'================ GET INSTALLED CHAINCODES ======================');
		} else {
			logger.debug(
				'================ GET INSTANTIATED CHAINCODES ======================');
		}

		query.getInstalledChaincodes(peer, installType, req.username, req.orgname)
		.then(function(message) {
			res.send(message);
		});
	});
	// Query to fetch channels
	app.get('/channels', function(req, res) {
		logger.debug('================ GET CHANNELS ======================');
		logger.debug('peer: ' + req.query.peer);
		var peer = req.query.peer;
		if (!peer) {
			res.json(getErrorMessage('\'peer\''));
			return;
		}

		query.getChannels(peer, req.username, req.orgname)
		.then(function(
			message) {
			res.send(message);
		});
	});


*/


/*



// Register and enroll user
app.post('/users', function(req, res) {
	var username = req.body.username;
	var orgName = req.body.orgName;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	helper.getRegisteredUsers(username, orgName, true).then(function(response) {
		if (response && typeof response !== 'string') {
			response.token = token;
			res.json(response);
		} else {
			res.json({
				success: false,
				message: response
			});
		}
	});
});
// Create Channel
app.post('/channels', function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	channels.createChannel(channelName, channelConfigPath, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Join Channel
app.post('/channels/:channelName/peers', function(req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	join.joinChannel(channelName, peers, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Install chaincode on target peers


// Instantiate chaincode on target peers
app.post('/channels/:channelName/chaincodes', function(req, res) {
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	instantiate.instantiateChaincode(channelName, chaincodeName, chaincodeVersion, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', function(req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}
	args = args.replace(/'/g, '"');
	args = JSON.parse(args);
	logger.debug(args);

	query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', function(req, res) {
	logger.debug('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('BlockID : ' + blockId);
	logger.debug('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	query.getBlockByNumber(peer, blockId, req.username, req.orgname)
		.then(function(message) {
			res.send(message);
		});
});
// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', function(req, res) {
	logger.debug(
		'================ GET TRANSACTION BY TRANSACTION_ID ======================'
	);
	logger.debug('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}

	query.getTransactionByID(peer, trxnId, req.username, req.orgname)
		.then(function(message) {
			res.send(message);
		});
});
// Query Get Block by Hash
app.get('/channels/:channelName/blocks', function(req, res) {
	logger.debug('================ GET BLOCK BY HASH ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let hash = req.query.hash;
	let peer = req.query.peer;
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}

	query.getBlockByHash(peer, hash, req.username, req.orgname).then(
		function(message) {
			res.send(message);
		});
});
//Query for Channel Information
app.get('/channels/:channelName', function(req, res) {
	logger.debug(
		'================ GET CHANNEL INFORMATION ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	query.getChainInfo(peer, req.username, req.orgname).then(
		function(message) {
			res.send(message);
		});
});
// Query to fetch all Installed/instantiated chaincodes
app.get('/chaincodes', function(req, res) {
	var peer = req.query.peer;
	var installType = req.query.type;
	//TODO: add Constnats
	if (installType === 'installed') {
		logger.debug(
			'================ GET INSTALLED CHAINCODES ======================');
	} else {
		logger.debug(
			'================ GET INSTANTIATED CHAINCODES ======================');
	}

	query.getInstalledChaincodes(peer, installType, req.username, req.orgname)
	.then(function(message) {
		res.send(message);
	});
});
// Query to fetch channels
app.get('/channels', function(req, res) {
	logger.debug('================ GET CHANNELS ======================');
	logger.debug('peer: ' + req.query.peer);
	var peer = req.query.peer;
	if (!peer) {
		res.json(getErrorMessage('\'peer\''));
		return;
	}

	query.getChannels(peer, req.username, req.orgname)
	.then(function(
		message) {
		res.send(message);
	});
});
*/
