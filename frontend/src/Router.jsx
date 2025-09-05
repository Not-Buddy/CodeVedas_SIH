import { BrowserRouter, Routes, Route } from 'react-router-dom';
//import whatever components you want here
import HomePage from './pages/Home';
import Login from './pages/login/login';

const Router = () => {
  return (
    <BrowserRouter>
      {/* <Navbar />  <-- Navbar here would keep it static for all pages.*/}
      <Routes>
        <Route index element={<Login />} />
        <Route path="/home" element={<HomePage />} />
        {/* Add your pages in a Route component like these: */}
        {/* 
        <Route index element={<HomePage />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile/:id" element={<Profile />} />
        <Route path="/cats" element={<Categories />} /> 
        */}
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
