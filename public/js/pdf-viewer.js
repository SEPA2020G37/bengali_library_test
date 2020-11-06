function prev() {
  let isbn = $("#embed").data("isbn");
  let user = $("#embed").data("userId");
  let urlSearchParams = new URLSearchParams();
  urlSearchParams.append("isbn", isbn);
  urlSearchParams.append("userId", user);
  let url = "/prev?" + urlSearchParams.toString();
  fetch(url, { method: "GET" })
    .then(function (response) {
      return response.json();
    })
    .then((data) => {
      getNewPdf(data.link, data.pageNumber);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function next() {
  let isbn = $("#embed").data("isbn");
  let user = $("#embed").data("user");
  let urlSearchParams = new URLSearchParams();
  urlSearchParams.append("isbn", isbn);
  urlSearchParams.append("userId", user);
  let url = "/next?" + urlSearchParams.toString();
  fetch(url, { method: "GET" })
    .then(function (response) {
      return response.json();
    })
    .then((data) => {
      getNewPdf(data.link, data.pageNumber);
    })
    .catch(function (error) {
      console.log(error);
    });
}

function getNewPdf(link, pageNumber) {
  var embed = document.getElementById("embed");
  embed.setAttribute("src",link);
  embed.dataset.page = pageNumber;
}
