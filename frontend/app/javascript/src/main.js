console.log('i was ran! hi');

global.toggleTheme = function() {
    const body = document.querySelector("body");
    if (body.classList.contains("dark")) {
        body.classList.remove("dark");
    } else {
        body.classList.add("dark");
    }
};

let prev_data = null;

function update_count() {
    document.getElementById("num-selected").textContent = document.querySelectorAll("tr.table-active").length;
}

function update_table(data) {
    tbody = document.getElementById("phoneData");
    tbody.querySelectorAll('*').forEach(n => n.remove());
    for (let i = 0; i < data.length; i++) {
        const phone = data[i];
        let tr = document.createElement('tr');
        tr.classList.add("table-active");
        tr.onclick = select;
        tr.setAttribute("data-port", phone.port);
        tr.innerHTML =
`
    <th scope="row">${phone.port - 3000}</th>
    <td>${phone.port}</td>
    <td>${phone.health}</td>
    <td>${phone.status}</td>
    <td>
        <button type="button" class="btn btn-secondary" data-bs-toggle="collapse" data-bs-target="#phone-${phone.port}" aria-expanded="false" aria-controls="phone-${phone.port}">
            Actions
        </button>
    </td>
`;
        tbody.appendChild(tr);
        tr = document.createElement('tr');

        tr.innerHTML =
`
    <td id="phone-${phone.port}" class="collapse hide" colspan="5">
        <div class="container">
            <h6 class="text-center">${phone.d_id}</h6>
            <div class="row">
                <div class="col-4">
                    <p>TODO -- map</p>
                </div>
                <div class="col-8">
                    <span id="stats-${phone.port}">
                        <pre><code>${JSON.stringify(phone, undefined, "  ")}</code></pre>
                    </span>
                    <hr>
                    <div class="input-group">
                        <input type="file" class="form-control" id="route-file-${phone.port}" onchange="upload(${phone.port});">
                        <label class="input-group-text" for="route-file-${phone.port}">Upload</label>
                    </div>
                    <br>
                    <button type="button" class="btn btn-success" id="start-${phone.port}" onclick="start(${phone.port});">Start</button>
                    <button type="button" class="btn btn-danger" id="stop-${phone.port}" onclick="stop(${phone.port});">Stop</button>
                    <button type="button" class="btn btn-warning" id="clear-${phone.port}" onclick="clear(${phone.port});">Clear route</button>
                    <div class="spinner-grow spinner-grow-sm text-info d-none" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </div>
            </div>
        </div>
    </td>
`;
        tbody.appendChild(tr);
    }
    update_count();
}

global.sync = function(data) {
    // stupid way to test if there were any updates
    if (JSON.stringify(prev_data) !== JSON.stringify(data)) {
        console.log(data);
        update_table(data);
    }
    prev_data = data;
};

global.add = function() {
    fetch("/phone", {
        method: "POST",
        body: JSON.stringify({})
    }).then(console.log);
};

global.startAll = function() {
    console.log("startAll");
    document.querySelectorAll("tr.table-active").forEach(element => {
       start(element.getAttribute("data-port"));
    });
};

global.stopAll = function() {
    console.log("stopAll");
};

global.upload = function(port) {
    console.log("upload", port);
    let input = document.getElementById(`route-file-${port}`);
    input.classList.remove("text-success", "text-danger");
    let data = new FormData();
    data.append('route', input.files[0]);
    fetch(`http://localhost:${port}/route`, {
        method: "PUT",
        body: data
    }).then(res => {
        console.log(res);
        if (res.ok) {
            input.classList.add("text-success");
        } else {
            input.classList.add("text-danger");
        }
    }).catch(err => {
        console.log(err);
        input.classList.add("text-danger");
    });
};

global.start = function(port) {
    fetch(`http://localhost:${port}/test`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            freq: 500,
            rand: 100,
            i: 4
        })
    }).then(console.log).catch(console.log);
};

global.stop = function(port) {
    fetch(`http://localhost:${port}/test`, {
        method:"DELETE"
    }).then(console.log).catch(console.log);
};

global.clear = function(port) {
    fetch(`http://localhost:${port}/route`, {
        method:"DELETE"
    }).then(console.log).catch(console.log);
};

global.select = function(e) {
    const element = e.target;
    if (element.parentElement.nodeName === "TR") {
        if (element.parentElement.classList.contains("table-active")) {
            element.parentElement.classList.remove("table-active");
        } else {
            element.parentElement.classList.add("table-active");
        }
        update_count();
    } else {
        console.log(e);
    }
};
