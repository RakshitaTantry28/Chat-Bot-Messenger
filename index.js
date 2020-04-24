var express=require('express');
var bodyParser=require('body-parser');
const request =require('request')
var app=express();

app.use(bodyParser.json());
app.get('/',function(req,res) {
   const hubChallenge = req.query['hub.challenge'];
   const hubMode = req.query['hub.mode'];
   const token = req.query['hub.verify_token'];

   if(hubMode && token){
       if(token == 'ChatBot'){
           res.status(200).send(hubChallenge);
       }
   }
   else{
       res.status(403).end();
   }

});


app.post('/',function(req,res) {
    console.log('entered post');
    let body = req.body;
    //check webhook event is from page subscription
    if(body.object === 'page')
    {
        console.log('entered if');
        body.entry.forEach(function(entry){
            let webhook_event = entry.messaging[0];
            console.log(webhook_event);

            let sender_psid = webhook_event.sender.id;
            console.log('sender psid: ' + sender_psid);

            if(webhook_event.message){
                handleMessage(sender_psid,webhook_event.message);
            }
            else if (webhook_event.postback) {
              handlePostBack(sender_psid, webhook_event.postback);

            }
        });
        res.status(200).send('EVENT_RECEIVED');
    } else{
        res.status(404);
    }

});

//handle message events
function handleMessage(sender_psid ,received_message){
    let response;
    if(received_message.text){
        response={
            "text":`You sent the message: "${received_message.text}". Now send me an attachment!`
        }
    }else if (received_message.attachments) {
  
      // Gets the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;

        response = {
            "attachment": {
              "type": "template",
              "payload": {
                "template_type": "generic",
                "elements": [{
                  "title": "Is this the right picture?",
                  "subtitle": "Tap a button to answer.",
                  "image_url": attachment_url,
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Yes!",
                      "payload": "yes",
                    },
                    {
                      "type": "postback",
                      "title": "No!",
                      "payload": "no",
                    }
                  ],
                }]
              }
            }
          }
    }
    callSendAPI(sender_psid,response);
}
//handles messaging_postback events
function handlePostBack(sender_psid ,received_postback){
    let response;
    let payload=received_postback.payload;

    if(payload === 'yes'){
        response={"text": "Thanks!!"};
    }else if(payload === 'no'){
        response={"text":"Oops, try sending another image "};
    }

    // Send the message to acknowledge the postback
  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid ,response){
    let request_body ={
        "recipient":{
            "id": sender_psid
        },
        "message":response
    }

    request({
        "uri": "https://graph.facebook.com/v2.6/me/messages",
        "qs": { "access_token": 'EAAKEuRU33K8BAL9NZAZB2vK4zF4PpS6IKRGKfGXhL7qcJCYSMIkaOkVIsIZBOYZCiU3Wd45T5j3ZBSIyL2OVESZCElEFQdBBufkBxT1p9ZCRMDUQjxw2oFwYSM8jzixdYTFqeIjjD2VFygYWsTZAONL5gWk7sT5aqx2BRRqToJmxpwZDZD' },
        "method": "POST",
        "json": request_body
      }, (err, res, body) => {
        if (!err) {
          console.log('message sent!')
        } else {
          console.error("Unable to send message:" + err);
        }
      }); 
}

app.listen(3000,function(){
    console.log("example app listening to port 3000!");
});