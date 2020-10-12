export const fetchJson = async (url) => {
  const response = await fetch(url);
  return response.json();
};

export const getIconId = (icon) => {
  switch (icon) {
    case 'award':
      return 'trophy';

    case 'github':
      return 'github';

    case 'code':
      return 'code';

    case 'data':
      return 'data';

    case 'link':
      return 'globe';

    default:
      return null;
  }
};
