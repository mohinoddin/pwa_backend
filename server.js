var axios = require('axios');
require('dotenv').config();
const webpush = require('web-push');
let endpoint = process.env.endpoint;
let access_token = process.env.access_token;

async function getData(path) {
    var config = {
        method: 'get',
        url: endpoint + path + '&access_token=' + access_token,
        headers: {}
    };

    return axios(config)
        .then(function (response) {
            return response.data;
        })
        .catch(function (error) {
            if (error.response.data.errors) {
                console.log('Error while getting data from ' + path + ' Error Message : ' + error.response.data.errors[0].message + ' with error status :' + error.response.status);
                return error;
            } else if (error.response.status == 524) {
                console.log('Error while getting data from ' + path + ' with Error Message as : A timeout occurred while fetching data,  with error status :' + error.response.status);
            }
            return error;

        });
}

async function deletData(path) {
    var config = {
        method: 'delete',
        url: endpoint + path + '?access_token=' + access_token,
        headers: {}
    };

    return axios(config)
        .then(function (response) {
            return response.data;
        })
        .catch(function (error) {
            if (error.response.data.errors) {
                console.log('Error while deleting data from ' + path + ' Error Message : ' + error.response.data.errors[0].message + ' with error status :' + error.response.status);
                return error;
            } else if (error.response.status == 524) {
                console.log('Error while deleting data from ' + path + ' with Error Message as : A timeout occurred while fetching data,  with error status :' + error.response.status);
            }
            return error;

        });
}

const vapidDetails = {
    publicKey: process.env.VAPID_PUBLIC_KEY,
    privateKey: process.env.VAPID_PRIVATE_KEY,
    subject: process.env.VAPID_SUBJECT
};

function sendNotifications() {
    let subscriptionsData = getData('items/mobile_registration?limit=3000', 'get');
    const notification = JSON.stringify({
        title: "Test Notifications ",
        options: {
            body: `Test Notification kindly Ignore`,
        },
    });

    const options = {
        TTL: 10000,
        vapidDetails: vapidDetails,
    };

    subscriptionsData.then((subscriptionDataMaster) => {

        if (subscriptionDataMaster.hasOwnProperty('data')) {
            let subscriptions = subscriptionDataMaster.data;
            let count = 0;
            if (subscriptions.length > 0) {
                subscriptions.forEach((subscription, i) => {
                    let device_Reg_Data = JSON.parse(subscription.mobile_token);
                    webpush
                        .sendNotification(device_Reg_Data, notification, options)
                        .then((result) => {
                            count++;
                            console.log(`sending notification `);
                            if (i == subscriptions.length - 1) {
                                console.log('notification is sent to ', count + ' users');
                            }
                        })
                        .catch((error) => {
                            if (i == subscriptions.length - 1) {
                                console.log('notification is sent to ', count + ' users');
                            }
                            if (error.statusCode === 404 || error.statusCode === 410) {
                                let singleSubscriptionsData = deletData('items/mobile_registration/' + subscription.id);
                                singleSubscriptionsData.then((singleSubscriptions) => {
                                    console.log('Subscription has expired or is no longer valid so deleted the record successfully')
                                }).catch((error) => {
                                    console.log(error)
                                })
                            } else {
                                console.log(`Following Error occured with error message as: ${error} and status code as ${error.statusCode} `);
                            }
                        });
                })
            } else {
                console.log('no subscriber to send notification');
            }

        } else {
            console.log('users registration data not available ' + subscriptionDataMaster);
        }
    }).catch((error) => {
        console.log('API UNREACHEABLE error ', error);
    })
}


sendNotifications()