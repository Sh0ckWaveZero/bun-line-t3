type TemplateParameter = any[];

const regex = new RegExp(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g);

function template<T>(templateData: TemplateStringsArray, param: T[], delimiter = '\n') {
  let output = '';

  for (let i = 0; i < param.length; i += 1) {
    output += templateData[i] as any + param[i];
  }

  output += templateData[param.length];

  const lines: string[] = output.split(/(?:\r\n|\n|\r)/);

  return lines
    .map((text: string) => text.replace(/^\s+/gm, ''))
    .join(delimiter)
    .trim();
};

const pre = (
  templateData: TemplateStringsArray,
  ...param: TemplateParameter
): string => {
  return template(templateData, param, '\n');
}

const line = (
  templateData: TemplateStringsArray,
  ...param: TemplateParameter
): string => {
  return template(templateData, param, ' ');
}

const isKeyOfSchema = <T extends object>(
  key: unknown,
  schema: T,
): key is keyof T => {
  return typeof key === 'string' && key in schema;
}

const removeUndefined = <T extends object>(argv: T): Record<string, unknown> => {
  return Object.fromEntries(
    Object.entries(argv).filter(
      ([, value]: [string, unknown]) => value !== undefined,
    ),
  );
}

const isEmpty = (obj: any): boolean => {
  return (
    [Object, Array].includes((obj || {}).constructor) &&
    !Object.entries(obj || {}).length
  );
}

const compareDate = (dateA: string, dateB: string) => {
  const dateFromTimestampA = new Date(Number(dateA) * 1000);
  const dateFromTimestampB = new Date(dateB);

  return dateFromTimestampA.getTime() > dateFromTimestampB.getTime();
};

const expo = (price: string, symbol: string) => {
  const parsedPrice = Number(price);
  if (parsedPrice > 1) {
    return `${symbol} ${Number.parseFloat(price)
      .toFixed(3)
      .toString()
      .replace(regex, ',')}`;
  } else if (parsedPrice > 0.00001) {
    return customPriceFormat(price, 5, symbol);
  } else {
    return customPriceFormat(price, 3, symbol);
  }
}

const priceFormat = (price: string, symbol: string) => {
  return `${symbol} ${parseFloat(price).toString().replace(regex, ',')}`;
}

const customPriceFormat = (price: string, digit: number, symbol: string) => {
  return `${symbol} ${Number.parseFloat(price)
    .toExponential(digit)
    .toString()
    .replace(regex, ',')}`;
}

const volumeChangeFormat = (price: string) => {
  const parsedPrice = parseFloat(price);
  return `${parsedPrice > 0 ? '+' : ''}${parsedPrice
    .toFixed(2)
    .toString()
    .replace(regex, ',')}%`;
}

const lastUpdateFormat = (lastUpdate: string | number | null) => {
  lastUpdate = lastUpdate ? lastUpdate : new Date().toLocaleString();
  return new Date(lastUpdate).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
    hour12: false,
  });
};

const priceChangeColor = (price: string) => {
  return Number(price) > 0 ? '#00D666' : '#F74C6C';
};

const priceColor = (name: string) => {
  return name === 'Green' ? '#00D666' : '#F74C6C';
};

const randomItems = (source: any[]) => {
  const url = source;
  const randomIndex = Math.floor(Math.random() * url.length - 1);

  return url[randomIndex];
};

const getGoldPricesColors = (element: any, goldBarPrices: any) => {
  const colors: any[] = [];
  const colorsClassName: { [key: string]: string } = {
    'g-d': '#E20303',
    'g-n': '#444',
    'g-u': '#0F8000',
  };

  goldBarPrices.each((i: any, el: any) => {
    const className: any = element(el).attr('class');
    if (className !== 'span bg-span al-l') {
      const currentColor = colorsClassName[className.split(' ')[2]];
      colors.push(currentColor);
    }
  });

  return colors;
}


export const utils = {
  pre,
  line,
  isKeyOfSchema,
  removeUndefined,
  isEmpty,
  compareDate,
  expo,
  priceFormat,
  customPriceFormat,
  volumeChangeFormat,
  lastUpdateFormat,
  priceChangeColor,
  priceColor,
  randomItems,
  getGoldPricesColors,
}
