#!/usr/bin/env node

const fs = require('fs')
const reload = require('reload')
const helpers = require('handlebars-helpers')()
const path = require('path').posix
const argv = require('minimist')(process.argv)
const bodyParser = require('body-parser')
const cookieSession = require('cookie-session')
const exphbs = require('express-handlebars')
const express = require('express')

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
	isEnableClose
}

const hbs = exphbs.create({
	defaultLayout: 'main',
	partialsDir: path.join(__dirname, 'views/partials'),
	layoutsDir: path.join(__dirname, 'views/layouts'),
	helpers: {
		...helpers
	}
});

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
		req.path != '/login' &&
		!(req.path.startsWith('/css') || req.path.startsWith('/uikit') || req.path.startsWith('/reload')) &&
		!checkPassword(req, res)
	) {
		console.log('[!] Open page of login')
		return false
	}

	return next()
})

app.use('/uikit', express.static(path.join(path.dirname(require.resolve('uikit')), '..')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use(bodyParser.urlencoded({
	extended: false
}))

app.get(['/', '/dashboard'], (req, res) => {
	console.log('[!] Dashboard')
	return res.render('dashboard', {
		...handlebarsContext,
		path: '/dashboard'
	})
})

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

app.post('/login', (req, res) => {
	const passwordInput = req.body.password || ''
	req.session.password = passwordInput
	if (checkPassword(req, res)) {
		return res.redirect('/dashboard')
	}

	return res.redirect('/login')
})

app.listen(app.get('port'), () => {
	console.log(`[!] Open browser: http://localhost:${app.get('port')} or YOU_IP:${app.get('port')}`)
})

if (isDevMode) {
	reload(app)
}