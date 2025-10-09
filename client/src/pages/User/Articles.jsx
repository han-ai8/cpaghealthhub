const Articles = () => {
  return (
    <div className="min-h-screen bg-blue-200 p-6">
      <h1 className="text-4xl font-bold mb-6">Articles</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((article) => (
          <div key={article} className="card bg-base-100 shadow-xl">
            <figure className="bg-red-400 h-48 flex items-center justify-center">
              <span className="text-white font-semibold">Article Image {article}</span>
            </figure>
            <div className="card-body">
              <h2 className="card-title">Health Article {article}</h2>
              <p>Important health information and guidelines for community wellness.</p>
              <div className="card-actions justify-end">
                <button className="btn btn-primary btn-sm">Read More</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Articles;