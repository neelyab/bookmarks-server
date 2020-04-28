
const knex = require('knex')
const app = require('../src/app')
require('./setup')

const maliciousBookmark = {
    title:`Naughty naughty very naughty <script>alert("xss");</script>`,
    b_url: `<img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    b_description:`Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 3
}

const cleanBookmark = {
    id: 1,
    title:`Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;`,
    b_url: `<img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    b_description:`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`,
    rating: 3

}

describe('bookmarks endpoints', ()=>{
    let db
    before('make connection', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DATABASE_URL,
        })
        app.set('db', db)
    })
    after('disconnect from db',() => db.destroy())
    before('clean table', () => db('bookmarks_list').truncate())
    afterEach('clean tables after each test', () => db('bookmarks_list').truncate())

    context('given no bookmarks',()=>{

        const apiToken = process.env.API_KEY
        it('returns 200 ok response and empty array', ()=>{
            supertest(app)
            .get('/bookmarks')
            .set({Authorization: `Bearer ${apiToken}`})
            .expect(200, [])
        })
        it('GET bookmarks/:bookmarkId returns 404 not found when bookmark does not exist',()=> {
            const bookmarkId= 12345
            return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set({Authorization: `Bearer ${apiToken}`})
            .expect(404)
        })
        it('POST /bookmarks inserts bookmark and returns it in the response', ()=>{
            const newBookmark = {
                title: "new bookmark",
                b_url: "http://www.google.com",
                b_description: "a place to search for things",
                rating: 4
            }
            return supertest(app)
            .post('/bookmarks')
            .set({Authorization: `Bearer ${apiToken}`})
            .send(newBookmark)
            .expect(201)
            .then(res=>{
                expect(res.body.title).to.eql(newBookmark.title)
                expect(res.body.b_url).to.eql(newBookmark.b_url)
                expect(res.body.b_description).to.eql(newBookmark.b_description)
                expect(res.body.rating).to.eql(newBookmark.rating)
                expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
                expect(res.body).to.have.property('id')
            })
        })
        it('POST /bookmarks when a malicious bookmark is posted, xss cleans it', ()=>{
            return supertest(app)
            .post('/bookmarks')
            .set({Authorization: `Bearer ${apiToken}`})
            .send(maliciousBookmark)
            .expect(201)
            .then(res=> {
                expect(res.body).to.eql(cleanBookmark)
            })
        })
    })
    context('given bookmarks', ()=> {
        afterEach('clean tables after each test', () => db('bookmarks_list').truncate())
        const apiToken = process.env.API_KEY
       const bookmarks = [{
            id: 1,
            title: "google",
            b_url: "http://www.google.com",
            b_description: "a place to search for things",
            rating: 4
        },
        {
            id: 2,
            title: "bloc",
            b_url: "http://www.bloc.io",
            b_description: "learn how to code",
            rating: 5
        }];
        beforeEach('insert articles', () => {
              return db
              .into('bookmarks_list')
              .insert(bookmarks)
                 })
        it('GET returns all bookmarks', () => {
            return supertest(app)
            .get('/bookmarks')
            .set({Authorization: `Bearer ${apiToken}`})
            .expect(200, bookmarks)
        })
        it('GET /bookmarks/:id returns bookmark with id', () => {
            const bookmarkId = 1
            const expectedBookmark = bookmarks[bookmarkId -1]
            return supertest(app)
            .get(`/bookmarks/${bookmarkId}`)
            .set({Authorization: `Bearer ${apiToken}`})
            .expect(200, expectedBookmark)
        })
        it('DELETE deletes specified bookmark by id', ()=>{
            const bookmarkId = 1
            const expectedArray = bookmarks.filter(bm => bm.id !== bookmarkId)
            return supertest(app)
            .delete(`/bookmarks/${bookmarkId}`)
            .set({Authorization: `Bearer ${apiToken}`})
            .expect(204)
            .then(res =>{
                supertest(app)
                .get('/bookmarks')
                .expect(200, expectedArray)
            })
        })
        it('UPDATE returns 201 status and updates the bookmark', () => {
            const bookmarkId = 1
            const updatedBookmark = {
                title: "google search", 
                b_url: "http://www.google.com",
                b_description: "a place to search for things",
                rating: 4  
            }
            return supertest(app)
            .patch(`/bookmarks/${bookmarkId}`)
            .set({Authorization: `Bearer ${apiToken}`})
            .send(updatedBookmark)
            .expect(204)
            .then(res=>{
                supertest(app)
                .get(`/bookmarks/${bookmarkId}`)
                .expect(updatedBookmark)
            })
        })
    })
})