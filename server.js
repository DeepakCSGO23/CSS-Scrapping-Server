const http=require('http')
const postcss=require('postcss')
const safeParser=require('postcss-safe-parser')
const port=5500

// Create a HTTP server
const server=http.createServer((req,res)=>{
    console.log('new client connected')
    // if(req.method==='POST'){
    //     let body='';
    //     req.on('data',chunk=>{
    //         // Conveting buffer to string
    //         body+=chunk.toString()
    //     })
    //     req.on('end',()=>{
    //         // Parsing the CSS data
    //         const root=postcss.parse(body,{parser:safeParser})
    //         console.log(root)
    //     })
    // }
})

server.listen(port,(err)=>{
    if(err){
        console.log("Something went wrong",err)
    }
    else{
        console.log('Server is listening on port',port)
    }
})