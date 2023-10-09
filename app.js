const express = require('express');
const crypto = require('node:crypto')
const cors = require('cors')
const {validateMovie, validatePartialMovie} = require('./Schemas/movies')
const movies = require('./movies.json')

const app = express();
app.use(express.json())
app.use(cors({
    origin: (origin, callback) => {
        const ACCEPTED_ORIGINS = [
            'http://localhost:8080',
            'http://192.168.1.40:8080',
            'http://localhost:8888',
            'http://localhost:1234',
            'http://localhost:1111',
            'http://movies.com'
        ]

        if (ACCEPTED_ORIGINS.includes(origin)){
            return callback(null, true)
        }

        if (!origin) {
            return callback(null, true)
        }

        return callback(new Error('Not allowed CORS'))
    }
}))
app.disable('x-powered-by')

app.get('/', (req, res)=>{
    res.json({message: 'Hola mundo'});
})



// Todos los recursos que sean movies se identifican con /movies
app.get('/movies', (req, res)=>{
    /*const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
    }*/
    

    const {genre} = req.query

    if(genre){
        const filteredMovies = movies.filter(
            movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
        )
        return res.json(filteredMovies)
    }

    res.json(movies)
})

app.get('/movies/:id', (req, res)=>{
    const {id} = req.params
    const movie = movies.find(movie => movie.id === id)

    if(movie) return res.json(movie)

    res.status(404).json({message: 'movie not found'})
})

app.post('/movies', (req, res) => {
    const result = validateMovie(req.body)

    if(result.error) {
        return res.status(400).json({error: JSON.parse(result.error.message)})
    }

    const newMovie = {
        id: crypto.randomUUID(), //uuid v4
        ...result.data
    }
    //esto no sería rest porque estamos guardando el estado del movies en memoria
    movies.push(newMovie)

    res.status(201).json(newMovie)
})

app.patch('/movies/:id', (req, res)=>{
    const result = validatePartialMovie(req.body)
    if (!result.success) {
        return res.status(404).json( {error: JSON.parse(result.error.message)})
    }
    
    const {id} = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if(movieIndex === -1) {
        return res.status(404).json({ message: 'Movie not found'})
    }

    const updatedMovie = {
        ...movies[movieIndex],
        ...result.data
    }

    movies[movieIndex] = updatedMovie

    res.json(updatedMovie)

})

/*app.options('/movies/:id', (req, res) => {
    const origin = req.header('origin')
    if(ACCEPTED_ORIGINS.includes(origin) || !origin){
        res.header('Access-Control-Allow-Origin', origin)
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')
    }
    res.send(200)
})*/

app.delete('/movies/:id', (req, res) => {
    const { id } = req.params
    const movieIndex = movies.findIndex(movie => movie.id === id)

    if (movieIndex === -1) {
        return res.status(404).json({message: 'Movie not found'})
    }

    movies.splice(movieIndex, 1)

    return res.json({message: 'Movie deleted'})
})

const PORT = process.env.PORT ?? 1234

app.listen(PORT, ()=>{
    console.log(`Server listening on port http://localhost:${PORT}`)
})