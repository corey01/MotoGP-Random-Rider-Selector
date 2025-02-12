#!/usr/bin/env node
const riderData = require("../utils/riderData.json");
const fs = require('fs');

const output = riderData.riders.map((rider) => rider.current_career_step.pictures.profile.main);

fs.writeFile('./ridersOutput.json', JSON.stringify(output), (err) => {
    if (err) throw err;
    console.log('The file has been saved!');
});
