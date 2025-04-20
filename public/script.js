const API_KEY = "u3Kk3TUsGANe6OMlaIMQNgjLWZlSMohrDK9DbXdO";
const today = new Date();
const startDate = new Date(today);
startDate.setDate(today.getDate() - 6); // updated time range for more variety max

const start = startDate.toISOString().split("T")[0];
const end = today.toISOString().split("T")[0];

fetch(
  `https://api.nasa.gov/neo/rest/v1/feed?start_date=${start}&end_date=${end}&api_key=${API_KEY}`
)
  .then((response) => response.json())
  .then((data) => {

    //Page variables - Bry
    let currentPage = 1;
    const itemsPerPage = 10;
    let pageList = [];

    //Function for creating pages - Bry
    function pageCreate(list, page) {
        const start = (page - 1) * itemsPerPage;
        const end = page * itemsPerPage;
        return list.slice(start, end);
    }

    const neos = Object.values(data.near_earth_objects).flat();

    const asteroidsWithDistance = neos.map((asteroid) => {
      const approachData = asteroid.close_approach_data[0];
      const distance = parseFloat(approachData.miss_distance.kilometers);
      // added size data - sam!!
      const diameterData = asteroid.estimated_diameter.kilometers;
      const averageDiameter =
        (diameterData.estimated_diameter_min +
          diameterData.estimated_diameter_max) /
        2;

      return {
        name: asteroid.name,
        distance,
        date: approachData.close_approach_date,
        speed: parseFloat(
          approachData.relative_velocity.kilometers_per_hour
        ).toFixed(2),
        averageDiameter, // added size data -sam!!
      };
    });

    const distances = asteroidsWithDistance.map((a) => a.distance);
    const minDistance = Math.min(...distances);
    const maxDistance = Math.max(...distances);

    // color coding
    function getDistanceColor(distance, min, max) {
      const ratio = (distance - min) / (max - min);
      if (ratio < 0.2) return "red";
      if (ratio < 0.4) return "orange";
      if (ratio < 0.6) return "yellow";
      if (ratio < 0.8) return "green";
      return "blue";
    }

    const normalize = (dist) => {
      const minGap = 15;
      const maxGap = 100;
      return (
        ((dist - minDistance) / (maxDistance - minDistance)) *
          (maxGap - minGap) +
        minGap
      );
    };

    // sorting lists
    const sortedByDistance = [...asteroidsWithDistance].sort(
      (a, b) => a.distance - b.distance
    );
    const closest = sortedByDistance.slice(0, 4);
    const farthest = sortedByDistance.slice(-4); // ascending order of farthest
    const top100 = sortedByDistance.slice(0, 100);

    // sorting by size - sam!!
    const sortedBySize = [...asteroidsWithDistance].sort(
      (a, b) => a.averageDiameter - b.averageDiameter
    );
    const smallest = sortedBySize.slice(0, 4);
    const largest = sortedBySize.slice(-4).reverse(); // biggest first

    // display list function
    //Added "paginated = false" for page creation - Bry
    const displayList = (list, headingText, paginated = false) => {
      const ul = document.getElementById("asteroid-list");
      const heading = document.getElementById("asteroid-heading");
      //Variables for page creation - Bry
      const pagination = document.getElementById("pageControls");
      const pageIndication = document.getElementById("pageIndicator");

      ul.innerHTML = "";
      heading.textContent = headingText;

      //Code for pagination, showing what page user is on. If it isn't applicable, page buttons don't show up - Bry
      if (paginated) {
        pageList = list;
        list = pageCreate(list, currentPage);
        pagination.style.display = "block";
        pageIndication.textContent = `Page ${currentPage} of ${Math.ceil(pageList.length / itemsPerPage)}`;
      } else {
        pagination.style.display = "none";
      }

      list.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = `${
          item.name
        } - ${item.distance.toLocaleString()} km - Speed: ${
          item.speed
          // added size info - sam!!
        } km/h - Size: ${item.averageDiameter.toFixed(2)} km`;
        li.classList.add("asteroid-item");

        //click funct that takes in event to stop propagation
        li.addEventListener("click", (event) => {
          event.stopPropagation();
          const gapPercent = normalize(item.distance);
          document.getElementById(
            "asteroid-space"
          ).style.marginLeft = `${gapPercent}vw`;
          document.getElementById(
            "distance-display"
          ).textContent = `Distance from Earth: ${item.distance.toLocaleString()} km`;
        });

        // color coding
        const color = getDistanceColor(item.distance, minDistance, maxDistance);
        li.style.backgroundColor = color;
        li.style.color = "white"; // white background for color coded text (for orange/yellow readability)
        li.style.padding = "8px";
        li.style.borderRadius = "6px";
        li.style.marginBottom = "10px"; //spacing between items

        ul.appendChild(li);
      });
    };

    // start page
    displayList(closest, "4 Closest Asteroids");

    // reset asterooid on click
    document.body.addEventListener("click", () => {
      document.getElementById("asteroid-space").style.marginLeft = `15vw`;
      document.getElementById("distance-display").textContent =
        "Click on an asteroid to see the distance";
    });

    // buttons
    document.getElementById("filter-closest").addEventListener("click", () => {
      displayList(closest, "4 Closest Asteroids");
    });

    document.getElementById("filter-farthest").addEventListener("click", () => {
      displayList(farthest, "4 Farthest Asteroids");
    });

    document.getElementById("filter-top100").addEventListener("click", () => {
      currentPage = 1;
      displayList(top100, "Top 100 Asteroids (Closest to Farthest)", true);
    });

    // added event listeners for size filters

    document.getElementById("filter-smallest").addEventListener("click", () => {
      displayList(smallest, "Smallest Asteroids (Top 4)");
      console.log("Getting results (smallest)...");
    });

    document.getElementById("filter-largest").addEventListener("click", () => {
      displayList(largest, "Largest Asteroids (Top 4)");
      console.log("Getting results (largest)...");
    });

    //Events for clicking on next and previous buttons - Bry
    document.getElementById("prevPage").addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        displayList(pageList, "Top 100 Asteroids (Closest to Farthest)", true);
      }
    });
    document.getElementById("nextPage").addEventListener("click", () => {
      const maxPage = Math.ceil(pageList.length / itemsPerPage);
      if (currentPage < maxPage) {
        currentPage++;
        displayList(pageList, "Top 100 Asteroids (Closest to Farthest)", true);
      }
    });
  })
  .catch((error) => console.error("Error fetching asteroid data:", error));
