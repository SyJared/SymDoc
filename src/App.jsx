import { useState } from 'react'
import UploadForm from './main/uploadForm'


function App() {


  return (
    <>
     <UploadForm onUploaded={(result) => console.log('Document uploaded:', result)} />
    </>
  )
}

export default App
