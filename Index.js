import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import QRCode from "qrcode";

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// PostgreSQL client setup
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "SOFT",
  password: "jk32@12345AA",
  port: 5432,
});

db.connect();

// Initial route to render page1.ejs
app.get("/", (req, res) => {
  res.render("page1.ejs");
  console.log("Working with first page");
});

// Form submission handling
app.post("/submit", (req, res) => {
  const { item_name, item_price, item_quantity } = req.body; // Extract data from the form
console.log(item_name, item_price, item_quantity )
  // Insert the new item into the database
  db.query(
    "INSERT INTO inventory (name, price, quantity) VALUES ($1, $2, $3)",
    [item_name, item_price, item_quantity],
    (err, result) => {
      if (err) {
        console.log("Error in inserting data", err.stack);
        res.status(500).send("Error inserting data into database, Perhaps the item already exists.!!!!");
      } else {
        // After inserting, query the database to get all items
        db.query("SELECT * FROM inventory", (err, result) => {
          if (err) {
            console.log("Error in query", err.stack);
            res.status(500).send("Error retrieving data from database");
          } else {
            const new_box = result.rows; // Store the fetched data
            console.log("new data as follows \n\n",new_box)
            res.render("page2.ejs", { object: new_box }); // Render page2.ejs with all items
          }
        });
      }
    }
  );
});


app.post("/qrgeneration", (req, res) => {
  const selectedItemName = req.body.name; // Adjust to match your input's name attribute
  console.log("QR generation triggered for item:", selectedItemName);

  // Query the database to get all items
  db.query("SELECT * FROM inventory", (err, result) => {
    if (err) {
      console.log("Error in retrieving data", err.stack);
      return res.status(500).send("Error retrieving data from database");
    }

    const items = result.rows; // All items from the database
    const selectedItem = items.find(item => item.name == selectedItemName); // Find the selected item

    if (selectedItem) {
      const { name, price, quantity } = selectedItem;

      // Generate QR code
      QRCode.toDataURL(`Name: ${name}\nPrice: ${price}\nQuantity: ${quantity}`, { errorCorrectionLevel: "H" }, (err, url) => {
        if (err) {
          console.error(err);
          return res.status(500).send("Error generating QR code");
        }
        // Render page3.ejs with the QR code and all items
        res.render("page3.ejs", { qrData: url, items:selectedItem });
      });
    } else {
      res.status(404).send("Item not found");
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is hot and live at: ${port}`);
});
