#!/usr/bin/env node

const path = require('path').posix
const reload = require('reload')
const helpers = require('handlebars-helpers')()
const argv = require('minimist')(process.argv)
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const exphbs = require('express-handlebars')
const express = require('express')

const Database = require('./base/database')
let database

const password = argv.password || ''
const port = argv.port || process.env.PORT || process.env.port || 3000
const isDevMode = argv.dev
const isEnableClose = !(argv['disable-close'] || false)

const checkPassword = (req, res) => {
	if (password == '') {
		return true
	}

	const passwordInput = req.session.password
	if (passwordInput != password) {
		res.redirect('/login')
		return false
	}

	return true
}

const app = express()
const handlebarsContext = {
	isDevMode,
	isEnableClose,
	database: ''
}

const hbs = exphbs.create({
	defaultLayout: 'main',
	partialsDir: path.join(__dirname, 'views/partials'),
	layoutsDir: path.join(__dirname, 'views/layouts'),
	helpers: {
		...helpers,
		console: text => console.log(text)
	}
})

app.engine('handlebars', hbs.engine)

app.set('port', port)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'handlebars')
app.set('trust proxy', 1)

app.use(
	cookieSession({
		name: 'session',
		keys: ['PSQL-StatsShow', 'psqlstatsshow']
	})
)

if (!isDevMode) {
	app.enable('view cache')
}

app.use((req, res, next) => {
	// Console.log(`[:]Path: ${req.path}`)
	if (
		req.path !== '/login' &&
		!(req.path.startsWith('/css') || req.path.startsWith('/uikit') || req.path.startsWith('/reload')) &&
		!checkPassword(req, res)
	) {
		console.log('[!] Open page of login')
		return false
	}

	if (!database) {
		database = new Database({
			database: req.session.database
		})
	}

	handlebarsContext.database = req.session.database

	return next()
})

app.use('/uikit', express.static(path.join(path.dirname(require.resolve('uikit')), '..')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use(bodyParser.urlencoded({
	extended: false
}))

app.get(['/', '/dashboard'], async (req, res) => {
	console.log('[!] Dashboard')

	const result = [{
		title: 'Most Used',
		qtTitle: 'Calls',
		list: await database.mostUsed()
	}, {
		title: 'Most Rows',
		qtTitle: 'Rows',
		list: await database.mostRows()
	}, {
		title: 'Max Time',
		qtTitle: 'Time',
		list: await database.maxTime()
	}, {
		title: 'Min Time',
		qtTitle: 'Time',
		list: await database.minTime()
	}, {
		title: 'Mean Time',
		qtTitle: 'Time',
		list: await database.meanTime()
	}, {
		title: 'Local Read',
		qtTitle: 'Block',
		list: await database.maxTime()
	}, {
		title: 'Local Write',
		qtTitle: 'Block',
		list: await database.maxTime()
	}]

	return res.render('dashboard', {
		...handlebarsContext,
		result: result.map(elemt => {
			return {
				...elemt,
				...handlebarsContext
			}
		}),
		path: '/dashboard'
	})
})

const search = async (req, res) => {
	const {
		query
	} = req.body
	let result
	if (query) {
		const select = await database.get(query, []).catch(error => {
			res.render('alert', {
				...handlebarsContext,
				path: req.path,
				text: error
			})
			return undefined
		})

		if (!select) {
			return undefined
		}

		if (select.error) {
			return res.render('alert', {
				...handlebarsContext,
				path: req.path,
				text: select.error
			})
		}

		result = {}
		result.keys = Object.keys(select[0])
		result.data = select.map(elemt => Object.values(elemt))
	}

	return res.render('search', {
		...handlebarsContext,
		result,
		path: '/dashboard'
	})
}

app.post('/search', search)
app.get('/search', search)

app.get('/close', async (req, res) => {
	if (!isEnableClose) {
		return res.render('alert', {
			...handlebarsContext,
			path: req.path,
			text: 'Disable!'
		})
	}

	console.log('[!] Shutdown Server...')
	res.render('alert', {
		...handlebarsContext,
		path: req.path,
		text: 'Shutdown Server...'
	})
	await new Promise(resolve => setTimeout(
		resolve,
		(5000) // 5s
	))
	return process.exit()
})

app.get('/singout', (req, res) => {
	console.log('[!] Sing out user')
	req.session.password = ''
	return res.redirect('/login')
})

app.get('/login', (req, res) => {
	console.log('[!] Login user')
	return res.render('login', {
		...handlebarsContext,
		path: req.path
	})
})

app.post('/login', async (req, res) => {
	req.session.password = req.body.password

	if (checkPassword(req, res)) {
		req.session.database = req.body.database
		database = new Database({
			database: req.session.database
		})

		await database.get('SELECT $1', ['Hello world!']).catch(() => {
			req.session.password = ''
			req.session.database = ''
			return res.redirect('/login')
		}).then(() => {
			return res.redirect('/dashboard')
		})
	}
})

app.listen(app.get('port'), () => {
	console.log(`[!] Open browser: http://localhost:${app.get('port')} or YOU_IP:${app.get('port')}`)
})

if (isDevMode) {
	reload(app)
}
