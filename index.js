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

app.get('/api/users/:_id/logs/:from?/:to?/:limit?', (req, res) => {

	User.findById(req.params._id, (err, user) => {

		if (err) {
			res.status(400).send("NOp, no puedo.");
		}

		let exercises = [];
		if (req.query.from || req.query.to || req.query.limit) {

			let from = req.query.from || new Date(-8640000000000000); // https://stackoverflow.com/questions/11526504/minimum-and-maximum-date
			let to = req.query.to || new Date();

			let limit;
			if (req.query.limit === undefined) { // Just making sure we catch 0 as a limit
				limit = Infinity;
			} else {
				limit = +req.query.limit;
			}

			for (let i = 0; i <= user._doc.log.length; i++) {
				
				// We've hit the limit of records we can send, or in the final iteration of the loop
				if (exercises.length === limit || i === user._doc.log.length) {
					res.json({id: user.id, user: user._doc.username, log: exercises, count: exercises.length })
					break;
				}

				let userDate = new Date(Object.assign({}, user._doc.log)[i].date);
				let toDate = new Date(to)
				let fromDate = new Date(from)

				// Let's ensure it matches between the dates specified
				if (userDate >= fromDate && userDate <= toDate) {
					exercises.push(user._doc.log[i])
				}
			}
		} else {
			// Return everything!
			res.json({id: user.id, user: user._doc.username, count: user._doc.log.length, log: user._doc.log })
		}
	})
})

app.post('/api/users/:_id/exercises', (req, res) => {

	User.findById(req.params._id, (err, user) => {
		
		if (err) {
			res.status(400).send("Sorry, we couldn't save this exercise log to the databse");
		}

		let date;
		// Deal with optional date fed in
		if (req.body.date && checkValidDate(req.body.date)) {
			date = new Date(req.body.date).toDateString()
		} else {
			date = new Date().toDateString()
		}
		
		const exercise = new Exercise({ description: req.body.description, duration: req.body.duration, date: date });

		if (user._doc.log === undefined) {
			user._doc.log = []
		}

		user._doc.log.push(exercise)

		user.save()
			.then(item => {
				res.json({ _id: item.id, username: item.username, date: date, duration: +req.body.duration, description: req.body.description });
			})
			.catch(err => {
				res.status(400).send("Sorry, we couldn't save this exercise log to the databse");
			});
	})
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
