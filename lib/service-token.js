const otp = require('otp');
const jwtDecode = require('jwt-decode');
const request = require('request');
// const fetch = require('../util/fetch');

const idamS2SUrl = 'http://rpe-service-auth-provider-aat.service.core-compute-aat.internal';
// const idamS2SUrl = 'http://betadevbccidams2slb.reform.hmcts.net/';
const microservice = process.env.S2S_NAME || process.env.APPSETTING_JUI_MICROSERVICE;
const secret = process.env.S2S_SECRET || process.env.APPSETTING_JUI_SECRET;


let agent;
let sshProxy;
function attachSSHProxy(proxy) {
    if(process.env.NODE_ENV === 'local') {
        let agent;
        if(!sshProxy) {
            const SocksProxyAgent = require('socks-proxy-agent');
            const proxyUrl = 'socks://127.0.0.1:9090';
            agent = new SocksProxyAgent(proxyUrl, true);
        }
        proxy.agent = agent;
    }
    return proxy;
}

let _cache = {};
function validateCache() {
    const currentTime = Math.floor(Date.now() / 1000);
    if(!_cache[microservice]) return false;
    return currentTime < _cache[microservice].expiresAt;
}

function getToken() {
  let token = _cache[microservice];
  console.log(token);
  return token;
}

function generateToken() {
    const oneTimePassword = otp({secret: secret}).totp();
    const body = {
        oneTimePassword: oneTimePassword,
        microservice: microservice
    };
    const options = attachSSHProxy({
        // url: `${idamS2SUrl}/testing-support/lease`,
        url: `${idamS2SUrl}/lease`,
        method: 'POST',
        agent: agent,
        // form: `microservice=${microservice}&oneTimePassword=${oneTimePassword}`,
        body: body,
        json: true
    });

    return new Promise((resolve, reject) => {
        request(options, (err, res, body) => {
          console.log(err);
          if (err) {
            reject(err);
            return;
          }
            console.log(res.statusCode);
            console.log(body);

            let tokenData;
            try {
              tokenData = jwtDecode(body);
            }
            catch(e) {
              reject(e);
              return;
            }
            _cache[microservice] = {
                expiresAt: tokenData.exp,
                token: body
            };
            console.log(tokenData);
            resolve();
        });
    });
}


function serviceTokenGenerator() {
    return new Promise((resolve, reject) => {

        // if(validateCache()) {
        //     resolve(getToken());
        // }
        // else {
            generateToken().then(() => {
                resolve(getToken());
            })
        // }
    });








}

module.exports = serviceTokenGenerator;
