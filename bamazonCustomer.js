var mysql = require("mysql");
var inquirer = require("inquirer");


var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "1234",
  database: "bamazon"
});

connection.connect(function(err) {
  if (err) throw err;
  runSearch();
});

  function printCol(dta) {
  	var len = (dta + "").length;
  	for (var i=len;i<20;i++) {
  		dta += " ";
  	}
  	return dta;
  }

 function listProducts() {
   var p = new Promise(function(resolve, reject) {
   		  var query = "SELECT * FROM products";
		  connection.query(query, function(err, res) {
		  	console.log(printCol("Item Id") + 
		  		        printCol("Product Name") + 
		  		        printCol("Price") + 
		  		    	printCol("Department Name")  + 
		  		    	printCol("Stock Quantity"));
		  	var itemIdList = [];
		    for (var i = 0; i < res.length; i++) {
		      var prod = res[i];
		      var id = prod.item_id;
		      itemIdList.push("" + id);
		      var pn = prod.product_name;
		      var pr = prod.price;
		      var dn = prod.department_name;
		      var sq = prod.stock_quantity;
		      console.log(printCol(id) + 
		      	          printCol(pn) + 
		      	          printCol(pr) + 
		      	          printCol(dn) + 
		      	          printCol(sq));
		    }
		    resolve(itemIdList);
		  });
   });
   return p;
}

function checkQuantity(prodId) {
	var p = new Promise(function(resolve, reject) {
   		  var query = "SELECT stock_quantity FROM products where item_id = " + prodId;
		  connection.query(query, function(err, res) {
		  		var prod = res[0];
		  		resolve(prod.stock_quantity);
		  });
   });
   return p;
}

function buyProduct(prodId, newQuant) {
	var p = new Promise(function(resolve, reject) {
   		  var query = "update products SET stock_quantity = " + newQuant + 
   		              " where item_id = " + prodId;
		  connection.query(query, function(err, res) {
		  		resolve();
		  });
   });
   return p;
}

function getOrderPrice(pid, uq) {
	var p = new Promise(function(resolve, reject) {
   		  var query = "SELECT price FROM products where item_id = " + pid;
		  connection.query(query, function(err, res) {
		  		var prod = res[0];
		  		var orderPrice = prod.price * uq;
		  		resolve(orderPrice);
		  });
   });
   return p;
}

function runSearch() {
	listProducts().then(function(r) {
		inquirer
		    .prompt({
		      name: "action",
		      type: "list",
		      message: "Which product would you like to buy (enter ID)?",
		      choices: r
		    })
		    .then(function(answer) {
		    	var prodId = answer.action;
		      	inquirer
					    .prompt({
					      name: "action",
					      type: "input",
					      message: "How many units of procuct " + prodId + " would you like to buy?",
					    })
					    .then(function(answer) {
					    	var userWantsQuant = answer.action;
					    	console.log("User wants to buy " + userWantsQuant + " items.");
					    	checkQuantity(prodId).then(function(actualQuant) {
					    		if (userWantsQuant > actualQuant) {
					    			console.log("Insuffient Quantity!!");
					    			runSearch();
					    		}
					    		else {
					    			// update database and list the price of order
					    			buyProduct(prodId, (actualQuant - userWantsQuant)).
					    			then(function() {
					    				getOrderPrice(prodId, userWantsQuant).then(function(orderTotal) {
					    					console.log("Your order total is: " + orderTotal);
					    					runSearch();
					    				});
					    			});

					    		}
					    	})

					    });	
		    })	
	});
  
}

