type Props<T> = {
  title: string;
  description: string;
  isLoading?: boolean;
  error?: string | null;
  items?: T[];
  emptyMessage?: string;
  renderItem?: (item: T, index: number) => React.ReactNode;
};

export function CapabilityCard<T>({ title, description, isLoading, error, items = [], emptyMessage, renderItem }: Props<T>) {
  if (isLoading) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="status">Loading...</p></div></section>;
  }

  if (error) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p role="alert">{error}</p></div></section>;
  }

  if (items.length === 0) {
    return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><p>{emptyMessage ?? `No ${title.toLowerCase()}`}</p></div></section>;
  }

  return <section className="card h-100"><div className="card-body"><h2 className="h4">{title}</h2><p>{description}</p><div>{items.map((item, index) => <div key={index}>{renderItem ? renderItem(item, index) : String(item)}</div>)}</div></div></section>;
}
