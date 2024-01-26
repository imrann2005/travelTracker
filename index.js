import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
  password: "shamshad05",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [];


async function checkVisisted() {
  const result = await db.query("SELECT country_code FROM visited_countries JOIN users ON users.id = visited_countries.user_id WHERE users.id = $1", [currentUserId]);
  console.log(result.rows);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

async function checkCurrentUser() {
  const result = await db.query("SELECT * FROM users")
  const data = result.rows;
  return data.find((user) => user.id == currentUserId);
}

async function checkUsersInDatabase() {
  try {
    const result = await db.query("SELECT * FROM users");
    // console.log(result.rows);
    users = result.rows;
  } catch (error) {
    console.log(error);
  }
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted();
  const currentUser = await checkCurrentUser();
  const allUsers = await checkUsersInDatabase();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: currentUser.color,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body.country;
  const currentUser = await checkCurrentUser();
  try {
    const result = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];
    const countryCode = data.country_code;
    console.log(countryCode);
    try {
      
      await db.query(
        "INSERT INTO visited_countries (country_code,user_id) VALUES ($1 , $2)",
        [countryCode, currentUser.id]
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add == "new") {
    res.render("new.ejs");
  }
  else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  console.log(req.body);
  const newUserName = req.body.name;
  const newUserColor = req.body.color;
  try {
    const result = await db.query("INSERT INTO users(name,color) VALUES($1,$2) RETURNING *", [newUserName, newUserColor]);
    const newUserDetails = result.rows[0];
    users.push(newUserDetails);

    res.redirect("/");
  } catch (error) {
    console.log(error);
  }

});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
