import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  password: "postgresyash63",
  host: "localhost",
  port: 5432,
  database: "world",
});

db.connect();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function getVisitedCountries() {
  const { rows: countriesData } = await db.query(
    "SELECT * FROM visited_countries"
  );
  let countries = [];
  countriesData.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await getVisitedCountries();
  res.render("index.ejs", { countries, total: countries.length });
});

app.post("/add", async (req, res) => {
  const countryFullname = req.body["country"];

  try {
    const { rows: result } = await db.query(
      "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE '%' || $1 || '%'",
      [countryFullname.toLowerCase()]
    );

    // console.log("result",result);     //output if wrong country name given :- result []

    const country_code = result[0].country_code; // ERROR here is wrong name given Cannot read properties of undefined (reading 'country_code')

    // console.log("country_code",country_code);   // does not execute if wrong country name given
    try {
      await db.query(
        "INSERT INTO visited_countries (country_code) VALUES ($1)",
        [country_code]
      );

      res.redirect("/");
    } catch (err) {
      // console.log("catch block inner", err);
      /* ERROR if country code given that already exists :-
      catch block inner 
      error: duplicate key value violates unique constraint "visited_countries_country_code_key" */

      const countries = await getVisitedCountries();
      res.render("index.ejs", {
        countries: countries,
        total: countries.length,
        error: "Country already added, try again :(",
      });
    }
  } catch (err) {
    // console.log("catch block outer", err);
    /* ERROR if wrong country name given :- 
    catch block outer 
    TypeError: Cannot read properties of undefined (reading 'country_code') */
    const countries = await getVisitedCountries();
    res.render("index.ejs", {
      countries: countries,
      total: countries.length,
      error: "Country does not exist try again",
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
