/**
 * Copyright 2017 IBM All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
'use strict';
var path = require('path');
var fs = require('fs');
var util = require('util');
var config = require('../../../env.json');
var helper = require('./helper.js');
var logger = helper.getLogger('install-chaincode');
var tx_id = null;
var channels = require('./create-channel.js');

//	const Client = require('fabric-client').Client;

/*
* @param {express.req} req - the inbound request object from the client
*  req.body.id - the id of the individual making the request
*  req.body.pw - the pw of the individual making the request
* @param {express.res} res - the outbound response object for communicating back to client
* @param {express.next} next - an express service to enable post processing prior to responding to the client
* @returns {object} - a JSON object
* @function

var inst = function(req, res, next) {


	return Client.installChaincode(req, 6000);


}

*/







/**
 * get orders for buyer with ID =  _id
 * @param {express.req} req - the inbound request object from the client
 *  req.body.id - the id of the buyer making the request
 *  req.body.userID - the user id of the buyer in the identity table making this request
 *  req.body.secret - the pw of this user.
 * @param {express.res} res - the outbound response object for communicating back to client
 * @param {express.next} next - an express service to enable post processing prior to responding to the client
 * @returns {Array} an array of assets
 * @function
 */

exports.inst = function(req, res, next) {

	logger.debug(
		'\n============ Install chaincode on organizations ============\n');
	helper.setupChaincodeDeploy();


	let org=req.body.org;
	let peers=req.body.peers.split(',');
	let user=req.body.user;
	let chaincodePath=req.body.chaincodePath;
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
			}
			all_good = all_good & one_good;
		}
		if (all_good) {
			logger.info(util.format(
				'Successfully sent install Proposal and received ProposalResponse: Status - %s',
				proposalResponses[0].response.status));
			logger.debug('\nSuccessfully Installed chaincode on organization ' + org +
				'\n');
			return 'Successfully Installed chaincode on organization ' + org;
			res.send("it's done");
		} else {
			logger.error(
				'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...'
			);
			return 'Failed to send install Proposal or receive valid response. Response null or status is not 200. exiting...';
		}
	}, (err) => {
		logger.error('Failed to send install proposal due to error: ' + err.stack ?
			err.stack : err);
		throw new Error('Failed to send install proposal due to error: ' + err.stack ?
			err.stack : err);
	});
};
