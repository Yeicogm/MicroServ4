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

const exerciseSchema = new Schema({
	description: { type: String, required: true },
	duration: { type: Number, required: true },
	date: { type: String, required: true }
});
const Exercise = mongoose.model('Exercise', exerciseSchema);

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
async function retrieveAllData() { //funcion q trae todo los user
	const filter = {}
	return await User.find(filter)
}
app.get('/api/users', (req, res) => {
	retrieveAllData()
    .then((data) => {
		return res.json([...data])
	})
})

function checkValidDate(dateString) {
	// Intenta crear una nueva fecha con la cadena proporcionada
	const date = new Date(dateString);
	
	// Verifica que la fecha sea válida
	return date instanceof Date && !isNaN(date);
  }
  

app.post('/api/users/:_id/exercises', async (req, res) => {
	try { 
		const user = await User.findById(req.params._id);
		if (!user) { 
			return res.status(404).send("User not found");
		} 
		let date;
		if (req.body.date && checkValidDate(req.body.date)) {
			date = new Date(req.body.date).toDateString();
		} else { 
			date = new Date().toDateString(); 
		} 
		const exercise = new Exercise({
		description: req.body.description,
		duration: req.body.duration,
		date: date
		}); 
		if (!user.log) { 
			user.log = [];
		} 
		user.log.push(exercise);
		const savedUser = await user.save();
		res.json({ 
			_id: savedUser.id,
			username: savedUser.username,
			date: date,
			duration: +req.body.duration,
			description: req.body.description
		});
	} catch (err) { 
		console.log(err)
		res.status(400).send("Sorry, we couldn't save this exercise log to the database");
	} 
});

app.get('/api/users/:_id/logs/:from?/:to?/:limit?', async (req, res) => {
	try {
	  const user = await User.findById(req.params._id);
	  if (!user) {
		return res.status(404).json({ error: "User not found" });
	  }
  
	  let exercises = [];
	  if (req.query.from || req.query.to || req.query.limit) {
		let from = req.query.from ? new Date(req.query.from) : new Date(-8640000000000000); // Mínima fecha posible
		let to = req.query.to ? new Date(req.query.to) : new Date();
		let limit = req.query.limit ? parseInt(req.query.limit) : Infinity;
  
		for (let i = 0; i < user.log.length; i++) {
		  if (exercises.length === limit) break;
		  
		  let userDate = new Date(user.log[i].date);
		  if (userDate >= from && userDate <= to) {
			exercises.push(user.log[i]);
		  }
		}
		res.json({ _id: user._id, username: user.username, count: exercises.length, log: exercises });
	  } else {
		res.json({ _id: user._id, username: user.username, count: user.log.length, log: user.log });
	  }
	} catch (err) {
	  res.status(500).json({ error: "Sorry, we couldn't save this exercise log to the database" });
	}
  });
  


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
