const express = require('express');
const webpush = require('web-push');
const bodyparser = require('body-parser');
var cors = require('cors')
require('dotenv').config()
const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

function sendNotifications(subscriptions) {
  // Create the notification content.
  const notification = JSON.stringify({
    title: "Test Notifications ",
    options: {
      body: `New Notification Triggereed`,
    },
  });

  const options = {
    TTL: 10000,
    vapidDetails: vapidDetails,
  };
  // Send a push message to each client specified in the subscriptions array.
  subscriptions.forEach((subscription) => {
    const endpoint = subscription.endpoint;
    const id = endpoint.substr(endpoint.length - 8, endpoint.length);
    webpush
      .sendNotification({'endpoint':subscription.endpoint,'keys':{'p256dh':subscription.keys.p256dh,'auth':subscription.keys.auth}}, notification, options)
      .then((result) => {
        console.log(`Endpoint ID: ${id}`);
        console.log(`Result: ${result.statusCode}`);
      })
      .catch((error) => {
        if (error.statusCode === 404 || error.statusCode === 410) {
          console.log('Subscription has expired or is no longer valid: ');
          // delet the record in database as Subscription has expired
        } 
        console.log(`Endpoint ID: ${id}`);
        console.log(`Error: ${error} `);
      });
  });
}

let subscriptions=[]
const app = express();
app.use(bodyparser.json());
app.use(cors())
// app.use(express.static('public'));

app.post("/add-subscription", (request, response) => {
  console.log(`Subscribing ${request.body.endpoint}`);
  subscriptions.push(request.body);
  response.status(200).send('subscriber details are added successfully');
  //add subscription to database
});


app.post("/notify-all", (request, response) => {
  console.log("Notifying all subscribers");
 //get all subscriptions from database and store in an array of subscription objects
  console.log(subscriptions)
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions);
    response.status(200).send({"message":`notificatioin is sent to ${subscriptions.length} subscribers`});
  } else {
    response.status(404).send({"message":"no subscriber to send notification"});
  }
});


const listener = app.listen(process.env.port||3001, () => {
  console.log(`Listening on port ${listener.address().port}`);
});
