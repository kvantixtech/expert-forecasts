(() => {
  const version = "latest";
  const base = "https://search.cdn.septima.dk/" + version;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = base + "/css/defaultView.css";
  document.head.appendChild(link);

  const script = document.createElement("script");
  script.src = base + "/septimasearch.min.js";
  script.onload = () => {
    Septima.Search.Api.configure({token: 'septima-septimasearch-eGU0s42DFh4C'})
  };
  document.head.appendChild(script);
})();
