const express = require('express')
const logger = require('./logger')
const xss = require('xss')
const BookmarksService = require('./bookmarks-service')

const bookmarksRouter = express.Router()
const bodyParser = express.json()

const bookmarkCleaner = bookmark => ({
    id: bookmark.id,
    title: xss(bookmark.title),
    b_url: xss(bookmark.b_url),
    b_description: xss(bookmark.b_description),
    rating: bookmark.rating
})


bookmarksRouter
    .route('/bookmarks')
    .get((req, res, next) => {
        BookmarksService.getAllBookmarks(req.app.get('db'))
        .then(bookmarks => {
            res.json(bookmarks.map(bookmarkCleaner))
        })
        .catch(next)
        })
    .post(bodyParser, (req, res) => {
        const {title, b_url, b_description, rating} = req.body
        if(!title){
            logger.error('title is required')
            return res.status(400).send('Invalid data')
        }
        if(!b_url){
            logger.error('url is required')
            return res.status(400).send('Invalid data')
        }
        if(!rating || rating > 5 || rating < 1){
            logger.error('rating is required / invalid number range')
            return res.status(400).send('Invalid data')
        }
        const bookmark = {
            title,
            b_url,
            b_description,
            rating
        }
        BookmarksService.postBookmark(req.app.get('db'), bookmark)
        .then(bookmark=> {
            logger.info(`bookmark with ${bookmark.id} created`)
            res
            .status(201)
            .location(`/bookmarks/${bookmark.id}`)
            .json(bookmarkCleaner(bookmark))
        })
})

bookmarksRouter
    .route('/bookmarks/:id')
    .all((req, res, next)=>{
        BookmarksService.getById(req.app.get('db'), req.params.id)
        .then(bookmark=> {      
        if (!bookmark) {
            return res.status(404).json({
             error: { message: `bookmark doesn't exist` }
            })
        }
        res.bookmark = bookmark
        next()
        })
        .catch(next)
    })
    .get((req, res)=> {
        res.status(200).json(bookmarkCleaner(res.bookmark))
    })
    .delete((req, res)=>{
        const {id} = req.params

        BookmarksService.deleteBookmark(req.app.get('db'), id)
        .then(bookmark=>{
            logger.info(`bookmark id ${id} deleted`)
            return res.status(204).send('bookmark deleted')
            .end()
        })
    })
    .patch(bodyParser, (req, res, next)=>{
        const {title, b_url, b_description, rating} = req.body
        const {id} = req.params
        const updatedBookmark = {title, b_url, b_description, rating}
        const numberOfValues = Object.values(updatedBookmark).filter(Boolean).length
        if (numberOfValues === 0){
            return res.status(400).json({error: { message:'please provide a title, url, description, or rating to update'}})
        }
        BookmarksService.patchBookmark(
            req.app.get('db'),
            id,
            updatedBookmark
        )
        .then(() =>{
            logger.info(`bookmark id ${id} updated`)
            res.status(204)
            .end()
        })
        .catch(next)
    }) 

module.exports = bookmarksRouter