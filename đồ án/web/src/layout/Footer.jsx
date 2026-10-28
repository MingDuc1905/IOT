export function Footer() {
  return (
    <footer className="footer footer-transparent d-print-none mt-auto">
      <div className="container-xl">
        <div className="row text-center align-items-center flex-row-reverse">
          <div className="col-lg-auto ms-lg-auto">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">
                <span className="text-secondary">Đồ Án Môn Học Internet Vạn Vật (IoT)</span>
              </li>
              <li className="list-inline-item">
                <span className="text-secondary">Dải đo: 0 ~ 0.40 Bar</span>
              </li>
            </ul>
          </div>
          <div className="col-12 col-lg-auto mt-3 mt-lg-0">
            <ul className="list-inline list-inline-dots mb-0">
              <li className="list-inline-item">
                HydroWatch &copy; 2026 &mdash; Trạm đo áp lực nước thời gian thực
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
