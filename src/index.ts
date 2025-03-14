import axios from "axios";

const crawl = async (url: string) => {
    try {
        const response = await axios.get(url);
        const html = response.data;
        console.log("html", html);
    } catch (error) {
        console.error("Error fetching the URL:", error);
    }
};

crawl("https://bibleminute.co");