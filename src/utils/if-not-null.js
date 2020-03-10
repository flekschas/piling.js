const ifNotNull = (v, alternative = null) => (v === null ? alternative : v);

export default ifNotNull;
