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
 const compose = require('docker-compose');
 const composefile = require('composefile');

////////////////////////////////////////////
///// Here are peer related parameters/////
///////////////////////////////////////////


var createPeer =function(peerName, peerOrg, tlsenabled, tlscert) {

const options = {
  outputFolder: "/tmp",
  filename: 'docker-compose.yml',
  services: {
    'peer': {
      container_name: peerName+'.'+peerOrg+'.example.com',
      image: 'hyperledger/fabric-peer:x86_64-1.1.0',
      environment: [
         'CORE_LOGGING_PEER= debug',
         'CORE_CHAINCODE_LOGGING_LEVEL= DEBUG',
         'CORE_VM_ENDPOINT= unix:///host/var/run/docker.sock',
         'CORE_PEER_ID= '+peerName+'.'+peerOrg+'.example.com',
         'CORE_PEER_ADDRESS= '+peerName+'.'+peerOrg+'.example.com:7051',
         'CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=pershing',
         'CORE_PEER_LOCALMSPID=Org1MSP',
         'CORE_PEER_MSPCONFIGPATH=/etc/hyperledger/user/msp',
         'CORE_LEDGER_STATE_STATEDATABASE=CouchDB',
         'CORE_PEER_GOSSIP_USELEADERELECTION=true',
         'CORE_PEER_GOSSIP_ORGLEADER=false',
         'CORE_PEER_GOSSIP_EXTERNALENDPOINT= '+peerName+'.'+peerOrg+'.example.com:7051',
         'CORE_PEER_GOSSIP_SKIPHANDSHAKE=true',
         'CORE_PEER_TLS_ENABLED='+tlsenabled,
         'CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/peer/tls/server.key',
         'CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/peer/tls/server.crt',
         'CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/peer/tls/ca.crt' ],
      working_dir: '/opt/gopath/src/github.com/hyperledger/fabric',
      command: 'peer node start',
      ports: [
         '7051:7051',
         '7053:7053'],
			volumes: [
		          '/var/run/:/host/var/run/',
		          tlscert+'/crypto-config/peerOrganizations/org1.example.com/peers/peer0.org1.example.com:/etc/hyperledger/peer',
		          tlscert+'/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp:/etc/hyperledger/user/msp'
			],
			depends_on: [
	            'couchdb'
			]
		},

	  'couchdb': {
	    container_name: 'couchdb'+peerName+peerOrg,
	    image: 'hyperledger/fabric-couchdb',
	    ports: [
	       '5984:5984'
			 ],
	    environment: {
	      DB_URL: 'http://localhost:5984/member_db'
			}
			}


 }
};

composefile(options, err => { console.log('done'); });



compose.up({ cwd: "/tmp", log: true })
  .then(
    () => { console.log('done')},
    err => { console.log('something went wrong:', err.message)}
  );
	return 'Successfully start the peer';
	res.send("The peer has been started.");

}
exports.createPeer = createPeer;
