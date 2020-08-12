const express = require('express');

const app = express();

app.get('/', (req, res, next) => {
    res.send("<h1>This is sourced from the new github repo</h1>");
});

app.listen(8080, () => {
    console.log('server started');
});
