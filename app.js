const express = require("express")
      ejs = require("ejs")
      paypal = require("paypal-rest-sdk");
      app = express()
      items = []
      fs = require("fs");
      yaml = require("js-yaml")
      mysql = require("mysql")
      port = "3000";


 var catalog = yaml.safeLoad(fs.readFileSync('./catalog.yaml', 'utf8'));
 var credentials = yaml.safeLoad(fs.readFileSync("./credentials.yaml", "utf8"));


      paypal.configure({
        'mode': 'sandbox', //sandbox or live
        'client_id': `${credentials.client_id}`,
        'client_secret': `${credentials.client_secret}`
      });

app.set('view engine', "ejs");

function createObject(name, price, description, id, for) {
  let item = {
    "intent": "sale",
    "payer": {
        "payment_method": "paypal"
    },
    "redirect_urls": {
        "return_url": `http://thediscordexperts.com:3000/purchase/${id}?for=${for}`,
        "cancel_url": "http://thediscordexperts.com:3000/cancel"
    },
    "transactions": [{
        "item_list": {
            "items": [{
                "name": name,
                "sku": "001",
                "price": price,
                "currency": "EUR",
                "quantity": 1
            }]
        },
        "amount": {
            "currency": "EUR",
            "total": price
        },
        "description": description
    }]
};

      return item;
}


//Items


// End

app.get("/", (req,res) => res.render('index'));

app.get("/pay/:id", (req,res) => {
  let id = req.params.id;
  let server = req.query.for;
  let item = catalog[id];
  console.log(item);
  let paypalitem = createObject(item.name, item.value, item.description, id, for)

paypal.payment.create(paypalitem, function (error, payment) {
    if (error) {
        throw error;
    } else {
        for(let i = 0; i < payment.links.length; i++) {
          if(payment.links[i].rel === "approval_url") {
            res.redirect(payment.links[i].href);
          }

        }
    }
});
})

  app.get('/purchase/:id', function (req, res) {

        const payerID = req.query.PayerID;
        const paymentID = req.query.paymentId;
        const id = req.params.id;
  const execute_payment_json = {
  "payer_id": payerID,
  "transactions": [{
      "amount": {
          "currency": "EUR",
          "total": `${catalog[id].value}`
      }
  }]
};

paypal.payment.execute(paymentID, execute_payment_json, function (error, payment) {
  if (error) {
      console.log(error.response);
      throw error;
  } else {
      console.log(JSON.stringify(payment));
  }
});

res.send("Success")
})



app.get("/cancel", (req,res) => {
  res.respond("Cancelled")
})

app.listen(port, () => console.log(`Server live on ${port}`))
