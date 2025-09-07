// import React, { useState, useEffect, useRef } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";

// const Login: React.FC = () => {
//     const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
//     const [, setTransitioning] = useState(false);
//     const [formData, setFormData] = useState({ email: "", password: "", username: "" });
//     const [message, setMessage] = useState("");

//     const tabsRef = useRef<(HTMLElement | null)[]>([]);
//     const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
//     const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);
//     const navigate = useNavigate();

//     useEffect(() => {
//         if (activeTabIndex === null) return;
//         const setTabPosition = () => {
//             const currentTab = tabsRef.current[activeTabIndex] as HTMLElement;
//             setTabUnderlineLeft(currentTab?.offsetLeft ?? 0);
//             setTabUnderlineWidth(currentTab?.clientWidth ?? 0);
//         };
//         setTabPosition();
//     }, [activeTabIndex]);

//     const allTabs = [
//         { id: "login", name: "Login" },
//         { id: "register", name: "Register" },
//     ];

//     const handleTabChange = (index: number) => {
//         setTransitioning(true);
//         setTimeout(() => {
//             setActiveTabIndex(index);
//             setTransitioning(false);
//             setMessage("");
//             setFormData({ email: "", password: "", username: "" });
//         }, 300);
//     };

//     const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         setFormData({ ...formData, [e.target.name]: e.target.value });
//     };

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         setMessage("");

//         const apiUrl = activeTabIndex === 0 ? "http://localhost:3030/users/login" : "http://localhost:3030/users/register";
//         const payload =
//             activeTabIndex === 0
//                 ? { email: formData.email, password: formData.password }
//                 : { username: formData.username, email: formData.email, password: formData.password };

//         try {
//             const response = await axios.post(apiUrl, payload);
//             if (response.data.token) {
//                 localStorage.setItem("token", response.data.token); // Store token
//                 navigate("/profile");
//             }

//             setMessage(response.data.message || "Success!");
//         } catch (error) {
//             setMessage(error.response?.data?.error || "Something went wrong");
//         }
//     };

//     return (
//         <div className="min-h-screen p-8 rounded-lg shadow-lg text-center flex flex-col justify-center items-center">
//             <video 
//                 autoPlay 
//                 loop 
//                 muted 
//                 className="absolute top-0 left-0 w-full h-full object-cover"
//             >
//                 <source src="https://videos.pexels.com/video-files/857251/857251-hd_1620_1080_25fps.mp4" type="video/mp4" />
//             </video>

//             {/* Overlay */}
//             <div className="absolute inset-0 bg-black bg-opacity-50" />
//             <div className="header absolute top-0 left-0 right-0 p-8 text-center z-20 mb-4">
//                 <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl drop-shadow-[0px_0px_32px_rgba(224,174,42,1.0)]">
//                     SketchSpace
//                 </h1>
//                 <p className="text-green-600 italic ml-36 mb-6 lg:text-xl drop-shadow-[0px_0px_16px_rgba(112,240,144,1)]">
//                     Draw Your Vision, Share Your Story.
//                 </p>
//             </div>
//             <div className="form bg-gray-100 p-6 rounded-lg border border-yellow-600 lg:p-10 max-w-3xl w-full bg-opacity-70 backdrop-blur-md">
//                     <div className="flex justify-center mb-4 relative flex-row h-12 rounded-3xl border border-[#e0ae2a] bg-[#e0ae2aaa] px-2 backdrop-blur-lg lg:px-4">
//                         <span
//                             className="absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-3xl py-2 transition-all duration-300"
//                             style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
//                         >
//                             <span className="h-full w-full rounded-3xl bg-[#e0ae2a]" />
//                         </span>
//                         {allTabs.map((tab, index) => (
//                             <button
//                                 key={index}
//                                 ref={(el) => (tabsRef.current[index] = el)}
//                                 className="my-auto cursor-pointer select-none rounded-full px-4 font-bold text-white"
//                                 onClick={() => handleTabChange(index)}
//                             >
//                                 {tab.name}
//                             </button>
//                         ))}
//                     </div>

//                     <form onSubmit={handleSubmit} className="transition-all duration-500">
//                         {activeTabIndex === 1 && (
//                             <input
//                                 type="text"
//                                 name="username"
//                                 placeholder="Username"
//                                 value={formData.username}
//                                 onChange={handleChange}
//                                 required
//                                 className="block w-full p-2 mb-2 border rounded"
//                             />
//                         )}
//                         <input
//                             type="email"
//                             name="email"
//                             placeholder="Email"
//                             value={formData.email}
//                             onChange={handleChange}
//                             required
//                             className="block w-full p-2 mb-2 border rounded"
//                         />
//                         <input
//                             type="password"
//                             name="password"
//                             placeholder="Password"
//                             value={formData.password}
//                             onChange={handleChange}
//                             required
//                             className="block w-full p-2 mb-2 border rounded"
//                         />
//                         <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
//                             {activeTabIndex === 0 ? "Login" : "Register"}
//                         </button>
//                     </form>
//                     {message && <p className="mt-4 text-[yellow]"> <strong>!! {message} !!</strong> </p>}
//                 </div>
//         </div>
//     );
// };

// export default Login;
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const [activeTabIndex, setActiveTabIndex] = useState<number>(0);
  const [formData, setFormData] = useState({ email: "", password: "", username: "" });
  const [message, setMessage] = useState("");
  const tabsRef = useRef<(HTMLElement | null)[]>([]);
  const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
  const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);
  const navigate = useNavigate();
  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3030";

  useEffect(() => {
    if (activeTabIndex === null) return;
    const setTabPosition = () => {
      const currentTab = tabsRef.current[activeTabIndex] as HTMLElement;
      setTabUnderlineLeft(currentTab?.offsetLeft ?? 0);
      setTabUnderlineWidth(currentTab?.clientWidth ?? 0);
    };
    setTabPosition();
  }, [activeTabIndex]);

  const allTabs = [
    { id: "login", name: "Login" },
    { id: "register", name: "Register" },
  ];

  const handleTabChange = (index: number) => {
    setActiveTabIndex(index);
    setMessage("");
    setFormData({ email: "", password: "", username: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    const apiUrl =
      activeTabIndex === 0
        ? `${API_URL}/users/login`
        : `${API_URL}/users/register`;
    const payload = activeTabIndex === 0
      ? { email: formData.email, password: formData.password }
      : { username: formData.username, email: formData.email, password: formData.password };

    try {
      const response = await axios.post(apiUrl, payload);
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        navigate("/profile");
      }
      setMessage(response.data.message || "Success!");
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || "Something went wrong";
      setMessage(errorMsg);
    }
  };

  return (
    <div className="min-h-screen p-8 rounded-lg shadow-lg text-center flex flex-col justify-center items-center">
      <video
        autoPlay
        loop
        muted
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="https://videos.pexels.com/video-files/857251/857251-hd_1620_1080_25fps.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-black bg-opacity-50" />
      <div className="header absolute top-0 left-0 right-0 p-8 text-center z-20 mb-4">
        <h1 className="text-yellow-600 text-4xl font-bold mb-2 lg:text-5xl drop-shadow-[0px_0px_32px_rgba(224,174,42,1.0)]">
          SketchSpace
        </h1>
        <p className="text-green-600 italic ml-36 mb-6 lg:text-xl drop-shadow-[0px_0px_16px_rgba(112,240,144,1)]">
          Draw Your Vision, Share Your Story.
        </p>
      </div>
      <div className="form bg-gray-100 p-6 rounded-lg border border-yellow-600 lg:p-10 max-w-3xl w-full bg-opacity-70 backdrop-blur-md">
        <div className="flex justify-center mb-4 relative flex-row h-12 rounded-3xl border border-[#e0ae2a] bg-[#e0ae2aaa] px-2 backdrop-blur-lg lg:px-4">
          <span
            className="absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-3xl py-2 transition-all duration-300"
            style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
          >
            <span className="h-full w-full rounded-3xl bg-[#e0ae2a]" />
          </span>
          {allTabs.map((tab, index) => (
            <button
              key={index}
              ref={(el) => (tabsRef.current[index] = el)}
              className="my-auto cursor-pointer select-none rounded-full px-4 font-bold text-white"
              onClick={() => handleTabChange(index)}
            >
              {tab.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="transition-all duration-500">
          {activeTabIndex === 1 && (
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
              className="block w-full p-2 mb-2 border rounded"
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="block w-full p-2 mb-2 border rounded"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="block w-full p-2 mb-2 border rounded"
          />
          <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded">
            {activeTabIndex === 0 ? "Login" : "Register"}
          </button>
        </form>
        {message && <p className="mt-4 text-yellow-600"><strong>!! {message} !!</strong></p>}
      </div>
    </div>
  );
};

export default Login;