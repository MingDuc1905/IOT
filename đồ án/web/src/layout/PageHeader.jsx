export function PageHeader({ title, description }) {
  return (
    <div className="page-header d-print-none">
      <div className="container-xl">
        <div className="row g-2 align-items-center">
          <div className="col">
            <div className="page-pretitle">HỆ THỐNG GIÁM SÁT ÁP SUẤT CẬN BIÊN IOT</div>
            <h1 className="page-title">{title}</h1>
            {description && <div className="text-secondary mt-1">{description}</div>}
          </div>
          <div className="col-12 col-md-auto ms-auto d-print-none">
            <div className="btn-list">
              <span className="badge bg-blue-lt">NodeMCU ESP8266 · MPS20N0040D</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
