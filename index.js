const express = require('express');
const axios = require('axios');
const path = require('path')
const connection = require('./config/db')
const usermodel = require('./models/usermodel')
const savedmodel = require("./models/savedmodel")
const {post} = require('./controllers/postdata')
const cookieParser = require("cookie-parser");
const { login } = require('./controllers/logindata');
const expressSession=require("express-session")
const flash = require("connect-flash");
const submodel = require('./models/submodel');


const app = express();

app.use(expressSession({
  resave:false,
  saveUninitialized:false,
  secret:"dddddd"
})
)

app.use(flash())

const YOUTUBE_API_KEY = 'AIzaSyBGBm02c1eP2DcMVhd2U6pLB_f_sd44VAg';

app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// middelware
function loginmiddelware(req,res,next){
  if(!req.cookies.email || req.cookies.email==0){
      let suc= req.flash("error","please Log in for further use")
      res.redirect("/")
      
  }
  else{
      next()
  }
}

// Large pool of diverse categories
const queries = [
  'cricket', 'tech', 'coding', 'music', 'travel', 'fitness', 'cooking', 'movies',
  'standup comedy', 'kannada songs', 'hindi songs', 'javascript tutorials', 'react js', 'gaming',
  'anime', 'startup ideas', 'life hacks', 'bike vlogs', 'trending shorts', 'fashion', 'vines'
];

app.get('/home',loginmiddelware, async (req, res) => {
  try {
    const selectedQueries = [];

    // Pick 4-5 random queries from the list
    while (selectedQueries.length < 5) {
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      if (!selectedQueries.includes(randomQuery)) {
        selectedQueries.push(randomQuery);
      }
    }

    let allVideos = [];

    // Fetch videos from each random query
    for (const query of selectedQueries) {
      const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
        params: {
          part: 'snippet',
          q: query,
          type: 'video',
          videoDuration: 'medium',
          maxResults: 55, // limit per query to total ~70 max
          key: YOUTUBE_API_KEY
        }
      });

      allVideos = allVideos.concat(response.data.items);
    }

    // Shuffle the combined results
    const shuffledVideos = allVideos.sort(() => Math.random() - 0.5);

    res.render('home', { videos: shuffledVideos });
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.send('Error fetching videos');
  }
});

app.get('/watch/:id',loginmiddelware, async (req, res) => {
  const videoId = req.params.id;
  let suc=req.flash("error")

  try {
    // Step 1: Fetch video details
    const videoRes = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
      params: {
        part: 'snippet,statistics',
        id: videoId,
        key: YOUTUBE_API_KEY,
      },
    });

    const video = videoRes.data.items[0];
    if (!video) return res.send("Video not found!");

    const channelId = video.snippet.channelId;

    // Step 2: Fetch channel details using channelId
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: {
        part: 'snippet,statistics',
        id: channelId,
        key: YOUTUBE_API_KEY,
      },
    });

    const channel = channelRes.data.items[0];

    // Step 3: Attach channel data to the video object
    video.snippet.subscriberCount = channel.statistics.subscriberCount;
    video.snippet.channelLogo = channel.snippet.thumbnails.default.url;
    video.snippet.channelId = channelId;

    res.render('watch', { video,suc });
  } catch (error) {
    console.error('Error loading video or channel:', error.message);
    res.send('Error loading video');
  }
});


const randomQueries = [
  'funny', 'vlog', 'challenge', 'dance', 'prank', 'gameplay', 'reaction',
  'motivation', 'food', 'pets', 'life hacks', 'trending', 'interview',
  'fails', 'beauty', 'travel', 'music', 'short film', 'fitness', 'how to'
];
app.get('/shorts',loginmiddelware, async (req, res) => {
  try {
    // Pick a random keyword from the list
    const randomQuery = randomQueries[Math.floor(Math.random() * randomQueries.length)];

    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: randomQuery,
        type: 'video',
        maxResults: 50,
        videoDuration: 'short',
        key: YOUTUBE_API_KEY
      }
    });

    const videos = response.data.items;
    res.render('shorts', { videos });

  } catch (error) {
    console.error('Error loading shorts:', error.message);
    res.send('Failed to load shorts');
  }
});
  

app.get("/",function(req,res){

  let suc=req.flash("error")
  res.cookie("email","")
  res.render("login",{suc})
})


app.get("/register",function(req,res){
  let suc=req.flash("error")
  res.render("register",{suc})
})


app.post("/login/user",async function(req,res){
  let{email,pass}=req.body
  await login(email,pass,res,req)
})


app.post("/register/user",async function(req,res)
{
  let {name,email,password}=req.body
  let findemail =  await usermodel.findOne({email:email})
  if(findemail){
    console.log("email already in use")
    let suc= req.flash("error","Already have an account! please Login")
    res.redirect("/")
  }
  
  await post(name,email,password,res)

  

})

app.post('/save/videos',loginmiddelware, async (req, res) => {
  const { id, title, channelTitle, description, thumbnail, url } = req.body;
  const findID= await savedmodel.findOne({
    id:id
  })
  if(findID){
    console.log("already in your saved list")
    let suc= req.flash("error","Already in Your library")
    res.redirect(`/watch/${id}`);
  }else{
  
  const saved = await savedmodel.create({
    email:req.cookies.email,
    id:id,
    title:title,
    channelTitle:channelTitle,
    description:description,
    thumbnail:thumbnail,
    url:url,

  })
  console.log("saved successfully")
  let suc= req.flash("error","Saved to library")
  res.redirect(`/watch/${id}`);
  }



  
});

app.get("/library",loginmiddelware, async (req, res) => {
  console.log(req.cookies.email)
  let suc=req.flash("error")
  const dins = await savedmodel.find({
    email: req.cookies.email
  });

  res.render("library", { dins,suc });
});



app.post("/remove/saved",loginmiddelware, async (req, res) => {
  try {
    const { id, title, channelTitle, description, thumbnail, url, email } = req.body;

    console.log("Received Data:");
    console.log("ID:", id);
    console.log("Title:", title);
    console.log("Channel Title:", channelTitle);
    console.log("Description:", description);
    console.log("Thumbnail URL:", thumbnail);
    console.log("Video URL:", url);
    console.log("Email:", email);

    // If you also want to delete this video from DB:
    await savedmodel.deleteOne({ id });

    let suc= req.flash("error","Removed Successfully")
    res.redirect("/library"); // or res.send("Video removed successfully.");
  } catch (err) {
    console.error("Error removing video:", err);
    res.status(500).send("Something went wrong.");
  }
});

app.post("/subscribe",loginmiddelware, async (req, res) => {
  const { channelTitle, channelId, channellogo} = req.body;
  console.log(channelId)
  let findcret = await submodel.findOne({
    email:req.cookies.email,
    channelID:channelId,
  

  })
  if(findcret){
    let suc= req.flash("error","already saved")
    res.redirect("/subscribe");
  }else{
    await submodel.create({
      email:req.cookies.email,
      channelID:channelId,
      channelTitle:channelTitle,
      channellogo:channellogo,
  
    })
    let suc= req.flash("error","subscribed Successfully")
    res.redirect("/subscribe");
  }
});

app.get("/subscribe",loginmiddelware, async (req, res) => {
  try {
    let suc=req.flash("error")

    const subs = await submodel.find({ email: req.cookies.email });
    console.log(subs)

    res.render("subscribe", {subs,suc});
  } catch (err) {
    console.error("Error fetching subscribed channels:", err.message);
    res.status(500).send("Something went wrong");
  }
});

app.get('/channel/:id',loginmiddelware, async (req, res) => {
  const channelId = req.params.id;

  try {
    // 1. Get channel details
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelRes = await axios.get(channelUrl);
    const channelDataRaw = channelRes.data.items[0];

    if (!channelDataRaw) return res.send("No channel found!");

    const channelData = {
      title: channelDataRaw.snippet.title,
      description: channelDataRaw.snippet.description,
      thumbnail: channelDataRaw.snippet.thumbnails.high.url,
      banner: channelDataRaw.brandingSettings?.image?.bannerExternalUrl,
      subs: channelDataRaw.statistics.subscriberCount,
      videos: channelDataRaw.statistics.videoCount,
      views: channelDataRaw.statistics.viewCount,
    };

    // 2. Get videos from the channel
    const videoListUrl = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_API_KEY}&channelId=${channelId}&part=snippet,id&order=date&maxResults=10`;
    const videoListRes = await axios.get(videoListUrl);

    const videos = videoListRes.data.items
      .filter(item => item.id.kind === 'youtube#video') // Only videos
      .map(video => ({
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        publishedAt: video.snippet.publishedAt,
      }));

    // 3. Render the view
    res.render("channelDetails", { channel: channelData, videos });

  } catch (error) {
    console.error("Error fetching channel details:", error.message);
    res.status(500).send("Error loading channel");
  }
});


app.post('/unsubscribe',loginmiddelware,async  (req, res) => {
  const { channelID } = req.body;
  await submodel.deleteOne({
    email:req.cookies.email,
    channelID:channelID
  })

  console.log("Unsubscribed from:", channelID);
  let suc= req.flash("error","Unsubscribed Successfully")
  res.redirect('/subscribe'); // or any route you want
});

app.get("/genratevideos",loginmiddelware, async (req, res) => {
  try {
    const searchQuery = req.query.search;

    const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
      params: {
        part: "snippet",
        q: searchQuery,
        key: YOUTUBE_API_KEY,
        maxResults: 100,
        videoDuration: 'medium',
        type: "video"
      }
    });

    const videoData = response.data.items.map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url
    }));

    res.render("searchResults", { query: searchQuery, videos: videoData });
  } catch (error) {
    console.error("API Error:", error.message);
    res.status(500).send("Failed to fetch videos.");
  }
});



app.get('/profile',loginmiddelware, async (req, res) => {
  let suc=req.flash("error")
  console.log(req.cookies.email)
  let user =await  usermodel.findOne({
    email:req.cookies.email,
  })

  res.render('profile', { user,suc });
});
app.post('/update-profile',loginmiddelware, async (req, res) => {
  const { name, email } = req.body;
  const exist = await usermodel.findOne({email:email})
  if(exist){
    req.flash("error", "Giver email is already exist , please use another email");
    res.redirect("/profile");
  }
  else{
    try {
      res.cookie("email",email)
      await usermodel.updateOne(
        { email: req.cookies.email },
        { $set: { name: name, email: email } }
      );
  
      req.flash("error", "Profile updated successfully.");
      res.redirect("/profile");
  
    } catch (error) {
      console.error("Error updating profile:", error);
      req.flash("error", "Something went wrong. Try again.");
      res.redirect("/profile");
    }
  }

 
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
