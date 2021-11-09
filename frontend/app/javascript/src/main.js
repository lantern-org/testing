console.log('i was ran! hi');

let prev_data = null;

function update_table(data) {
    tbody = document.getElementById("phoneData");
    tbody.querySelectorAll('*').forEach(n => n.remove());
    for (let i = 0; i < data.length; i++) {
        const phone = data[i];
        // <% @phones.each do |phone| %>
        // <tr class="table-active" onclick="select(this);">
        //     <th scope="row"><%= phone.port - 3000 %></th>
        //     <td><%= phone.port %></td>
        //     <td><%= phone.health %></td>
        //     <td><%= phone.status %></td>
        //     <td>
        //         <button type="button" class="btn btn-secondary" data-bs-toggle="collapse" data-bs-target="#phone-<%= phone.port %>" aria-expanded="false" aria-controls="phone-<%= phone.port %>">
        //             Actions
        //         </button>
        //     </td>
        // </tr>
        // <tr id="phone-<%= phone.port %>" class="collapse">
        //     <td colspan="5">
        //         <div>
        //             <%= phone.d_id %>
        //         </div>
        //     </td>
        // </tr>
        // <% end %>
        let tr = document.createElement("tr");
        tr.classList.add("table-active");
        tr.onclick = select;
        let th = document.createElement("th");
        th.scope = "row";
        th.innerText = phone.port - 3000;
        tr.appendChild(th);
        let td = document.createElement("td");
        td.innerText = phone.port;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerText = phone.health;
        tr.appendChild(td);
        td = document.createElement("td");
        td.innerText = phone.status;
        tr.appendChild(td);
        td = document.createElement("td");
        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("btn", "btn-secondary");
        button.setAttribute("data-bs-toggle", "collapse");
        button.setAttribute("data-bs-target", "#phone-"+phone.port);
        button.setAttribute("aria-expanded", false);
        button.setAttribute("aria-controls", "phone-"+phone.port);
        button.innerText = "Actions";
        td.appendChild(button);
        tr.appendChild(td);
        tbody.appendChild(tr);
        //
        tr = document.createElement("tr");
        tr.id = "phone-"+phone.port;
        tr.classList.add("collapse");
        td = document.createElement("td");
        td.colSpan = 5;
        td.innerText = phone.d_id;
        tr.appendChild(td);
        tbody.appendChild(tr);
    }
}

global.sync = function(data) {
    // stupid way to test if there were any updates
    if (JSON.stringify(prev_data) !== JSON.stringify(data)) {
        console.log(data);
        update_table(data);
    }
    prev_data = data;
}

global.add = function() {
    fetch("/phone", {
        method: "POST",
        body: JSON.stringify({})
    }).then(res => {
        console.log(res);
    });
}

global.select = function(e) {
    const element = e.target.parentElement;
    if (element.nodeName !== "TR") {
        console.log(e);
        return;
    }
    if (element.classList.contains("table-active")) {
        element.classList.remove("table-active");
    } else {
        element.classList.add("table-active");
    }
}
