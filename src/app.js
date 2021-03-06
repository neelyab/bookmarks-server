require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
const logger = require('./logger')

const app = express()

const bookmarksRouter = require('./bookmarks')

const morganOption = (NODE_ENV === 'production')
  ? 'tiny'
  : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())



app.use(function validateBearerToken(req, res, next){
    const apiToken = process.env.API_KEY    
    const bearerToken = req.get('Authorization')
    console.log(bearerToken)
    if(!apiToken || bearerToken.split(' ')[1] !== apiToken){
        logger.error(`unauthorized request ${req.path}`)
       return res.status(401).json({error: 'unauthorized request'})
    }
    next()
})

app.use(bookmarksRouter)

app.use(function errorHandler(error, req, res, next) {
    let response
    if (NODE_ENV === 'production') {
        response = { error: { message: 'server error' } }
    } else {
        console.error(error)
        response = { message: error.message, error }
    }
    res.status(500).json(response)
    })

module.exports = app