require('dotenv').config()
const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
//esquemas
const userSchema = new Schema({
  _id: {type: Schema.Types.ObjectId, auto: true},
  username: { type: String, require: true },
  log: []
});
const User = mongoose.model('User', userSchema);


//conector modo con datos de .env
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
	const myUser = new User({ username: req.body.username});
	myUser.save()
		.then(item => {
			res.json({ username: item.username, _id: item.id });
		})
		.catch(err => {
			res.status(400).send("Sorry, we couldn't save this user to the db");
		});
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
