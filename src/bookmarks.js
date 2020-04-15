const express = require('express')
const bookmarksRouter = express.Router()
const bodyParser = express.json()
const uuid = require('uuid/v4')
const {bookmarks} = require('./store')
const logger = require('./logger')

bookmarksRouter
    .route('/bookmarks')
    .get((req, res) => {
        res.json(bookmarks)
        })
    .post(bodyParser, (req, res)=>{
        const {title, url, description, rating} = req.body
        if(!title){
            logger.error('title is required')
            return res.status(400).send('Invalid data')
        }
        if(!url){
            logger.error('url is required')
            return res.status(400).send('Invalid data')
        }
        if(!description){
            logger.error('description is required')
            return res.status(400).send('Invalid data')
        }
        if(!rating){
            logger.error('rating is required')
            return res.status(400).send('Invalid data')
        }
        const id = uuid()
        const bookmark = {
            id,
            title,
            url,
            description,
            rating
        }
        bookmarks.push(bookmark)
        logger.info(`bookmark with ${id} created`)
        res
        .status(201)
        .location(`http://localhost:8000/bookmark/${id}`)
        .json(bookmark)
})

bookmarksRouter
    .route('/bookmarks/:id')
    .get((req, res)=>{
        const {id} = req.params
        const matchingBookmark = bookmarks.find(b=> b.id == id)
        if(!matchingBookmark){
            return res.status(404).send('Data not found')
        }
        res.json(matchingBookmark)
    })
    .delete((req, res)=>{
        const {id} = req.params
        const index = bookmarks.findIndex(b=>b.id == id)
        if(index === -1){
            logger.error(`id ${id} not found`)
            return res.status(404).send('bookmark id not found')
        }
        bookmarks.splice(index, 1)
        logger.info(`bookmark id ${id} deleted`)
        res.status(204)
        .end()
    })

module.exports = bookmarksRouter