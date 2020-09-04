const createUrlScript = (fnStr) =>
  window.URL.createObjectURL(new Blob([fnStr], { type: 'text/javascript' }));

export default createUrlScript;
