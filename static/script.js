 // Attach event listeners once the DOM is fully loaded
    document.getElementById('searchButton').addEventListener('click', function () {
        filterData();
    });

    document.getElementById('allButton').addEventListener('click', function () {
        filterData('all');
    });

    // Fetch the dataset from Flask backend on page load
    fetch('/get_data/all')
        .then(response => response.json())
        .then(initialData => {
            data = initialData;
            // Display the initial heatmap for the entire dataset
            console.log("Data:", data);
            updateHeatmap(data);
        })
        .catch(error => console.error('Error fetching initial data:', error));
});
  // Set up scales
  const xScale = d3.scaleBand()
  .domain(filteredData.map(d => d.Name))
  .range([0, width])
  .padding(0.1);

const yScale = d3.scaleLinear()
  .domain([0, d3.max(filteredData, d => Math.max(d.resource.BloodPressure, d.resource.Glucose))])
  .range([height, 0]);

// Define a color scale for BloodPressure
const colorScaleBloodPressure = d3.scaleLinear()
  .domain([60, 90, d3.max(filteredData, d => d.resource.BloodPressure)])
  .range(["#ffcccc", "#ff6666", "#ff0000"]); // Specify the color range for BloodPressure (light red to dark red)

// Define a color scale for Glucose
const colorScaleGlucose = d3.scaleLinear()
  .domain([70, 99, d3.max(filteredData, d => d.resource.Glucose)])
  .range(["#cce5ff", "#4d94ff", "#0066ff"]); // Specify the color range for Glucose (light blue to dark blue)

// Updated updateHeatmap function
function updateHeatmap(filteredData) {
    console.log('Updating heatmap with data:', filteredData);

    // Check if filteredData has the expected structure
    if (!filteredData || !Array.isArray(filteredData) || filteredData.length === 0 || !filteredData[0].resource.name) {
        console.error('Invalid or empty data:', filteredData);
        return;
    }

    // Ensure that the filteredData has the required properties (name, BloodPressure, Glucose)
    const requiredProperties = ['name', 'BloodPressure', 'Glucose'];
    if (!requiredProperties.every(prop => prop in filteredData[0].resource)) {
        console.error('Data does not have the required properties:', filteredData[0]);
        return;
    }

    // Clear existing content
    d3.select("#heatmap").selectAll("*").remove();

    // Define the dimensions of the heatmap
    const margin = { top: 80, right: 50, bottom: 60, left: 50 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Create an SVG element
    const svg = d3.select("#heatmap")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up scales
    const xScale = d3.scaleBand()
        .domain(filteredData.map(d => d.resource.name[0].text))
        .range([0, width])
        .padding(0.3);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(filteredData, d => Math.max(d.resource.BloodPressure, d.resource.Glucose))])
        .range([height, 0]);

    // Add red bars for BloodPressure
    svg.selectAll(".bar-bloodpressure")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-bloodpressure")
        .attr("x", d => xScale(d.resource.name[0].text))
        .attr("y", d => yScale(d.resource.BloodPressure))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.resource.BloodPressure))
        .attr("fill", "#ff0000")
        .on("click", d => handleBarClick(d));

    // Add blue bars for Glucose
    svg.selectAll(".bar-glucose")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "bar-glucose")
        .attr("x", d => xScale(d.resource.name[0].text) + xScale.bandwidth() * 2 / 3)
        .attr("y", d => yScale(d.resource.Glucose))
        .attr("width", xScale.bandwidth() / 3)
        .attr("height", d => height - yScale(d.resource.Glucose))
        .attr("fill", "#0066ff")
        .on("click", d => handleBarClick(d));

    // Add x-axis
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    // Add y-axis
    svg.append("g")
        .call(d3.axisLeft(yScale));

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Measurement");

    // Add names below the bars if filteredData is not the entire dataset
    if (filteredData !== data) {
        svg.selectAll(".bar-names")
            .data(filteredData)
            .enter()
            .append("text")
            .attr("class", "bar-names")
            .attr("x", d => xScale(d.resource.name[0].text) + xScale.bandwidth() / 2)
            .attr("y", height + margin.top + 10)
            .attr("text-anchor", "middle")
            .text(d => d.resource.name[0].text)
            .style("font-size", "12px")
            .style("cursor", "pointer")
            .on("click", d => handleBarClick(d));
    }

    // Add legend for Blood Pressure and Glucose
    const legend = svg.append("g")
        .attr("transform", "translate(-2, 1)");

    // Blood Pressure legend
    legend.append("rect")
        .attr("x", 5)
        .attr("y", -40)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#ff0000");

    legend.append("text")
        .attr("x", 25)
        .attr("y", -30)
        .text("Blood Pressure")
        .style("font-size", "12px");

    // Glucose legend
    legend.append("rect")
        .attr("x", 5)
        .attr("y", -20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#0066ff");

    legend.append("text")
        .attr("x", 25)
        .attr("y", -10)
        .text("Glucose")
        .style("font-size", "12px");

    // Display details if filteredData is not empty
    if (filteredData.length > 0) {
        displayDetails([filteredData[0]]);
    }
}

// Updated handleBarClick function
function handleBarClick(data) {
    // Set a property to indicate that a bar is clicked
    data.barClicked = true;

    // Call the displayDetails function with the clicked data
    displayDetails([data]);
}

// Updated filterData function
function filterData(searchTerm) {
    // Get the search input value
    const inputElement = document.getElementById("searchInput");
    const inputValue = inputElement.value.toLowerCase();

    // Filter the data based on the search term
    const filteredData = data.filter(entry => {
        const name = entry.resource.name[0].text.toLowerCase();
        return name.includes(inputValue);
    });

    // If a specific search term (all or a name) is provided, fetch the corresponding data
    if (searchTerm === 'all' || searchTerm === inputValue) {
        fetch(`/get_data/${searchTerm}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(filteredData => {
                // Update the heatmap with the filtered data
                updateHeatmap(filteredData);

                // Display details if filteredData is not empty
                if (filteredData.length > 0) {
                    displayDetails(filteredData);
                }
            })
            .catch(error => console.error('Error fetching filtered data:', error));
    } else {
        // Update the heatmap with the filtered data
        updateHeatmap(filteredData);

        // Display details if filteredData is not empty
        if (filteredData.length > 0) {
            displayDetails(filteredData);
        }
    }
}

// Function to update the UI with details
function displayDetails(selectedData) {
    // Check if selectedData and its properties are available
    if (!selectedData || selectedData.length === 0 || !('resource' in selectedData[0])) {
        console.error('Invalid or missing data:', selectedData);
        return;
    }

    // Extract information from the selectedData
    const patientData = selectedData[0].resource;

    // Calculate age using the calculateAge function
    const age = calculateAge(patientData.birthDate);

    // Define the default image URL
    const defaultImageURL = 'C:\\Users\\USER\\Desktop\\DiaPressor\\static\\images\\'; // Replace with your default image URL or path

    // Extracting the photo URL from the FHIR data
    const photoURL = patientData.photo && patientData.photo[0].url || defaultImageURL;

    // Convert the local path to a URL accessible from the browser
    const imageAbsolutePath = 'C:\\Users\\USER\\Desktop\\DiaPressor\\static\\images';
    const imageRelativePath = photoURL.replace(imageAbsolutePath, '').replace(/\\/g, '/');
    const imageBrowserURL = `http://localhost:5000/${imageRelativePath}`;

    // Create a div for details
    const detailsDiv = d3.select("body").append("div")
        .attr("id", "details")
        .style("position", "absolute")
        .style("background-color", "#f9f9f9")
        .style("padding", "10px")
        .style("border", "1px solid #d4d4d4")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    // Add details to the div
    detailsDiv.html(`
        <h3>${patientData.name[0].text}</h3>
        <a href="${imageBrowserURL}" target="_blank">
            <img src="${imageBrowserURL}" alt="Patient Image" style="max-width: 100%;">
        </a>
        <p>Date of Birth: ${patientData.birthDate || 'N/A'}</p>
        <p>Age: ${age || 'N/A'}</p>
        <p>Glucose: ${patientData.Glucose || 'N/A'}</p>
        <p>Blood Pressure: ${patientData.BloodPressure || 'N/A'}</p>
        <!-- Add other properties as needed -->
    `);

    // Display the details div
    detailsDiv.transition()
        .duration(200)
        .style("opacity", 1);
}

// Define the calculateAge function
function calculateAge(birthDate) {
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
        age--;
    }

    return age;
}
