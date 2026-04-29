export const config = {
  // استفاده از Edge Runtime برای سرعت بالاتر و رفع خطای res.end
  runtime: "edge", 
};

// دریافت آدرس مقصد از متغیرهای محیطی Netlify
const TARGET_BASE = (process.env.TARGET_DOMAIN || "").replace(/\/$/, "");

export default async function handler(request) {
  // بررسی تنظیم بودن دامنه مقصد
  if (!TARGET_BASE) {
    return new Response("Error: TARGET_DOMAIN is not set in Environment Variables.", { status: 500 });
  }

  try {
    const url = new URL(request.url);
    // ساخت آدرس کامل مقصد با حفظ مسیر (Path) و پارامترها (Query)
    const targetUrl = TARGET_BASE + url.pathname + url.search;

    // کپی و فیلتر کردن هدرها برای جلوگیری از شناسایی و تداخل
    const newHeaders = new Headers(request.headers);
    newHeaders.delete("host");
    newHeaders.delete("connection");
    newHeaders.delete("x-nf-client-connection-ip"); // هدر مخصوص نیتلیفای

    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      redirect: "manual",
    };

    // انتقال بدنه درخواست برای متدهایی مثل POST
    if (!["GET", "HEAD"].includes(request.method)) {
      fetchOptions.body = request.body;
      // برای پشتیبانی از استریمینگ در Fetch
      fetchOptions.duplex = "half"; 
    }

    // ارسال درخواست به سرور مقصد
    const response = await fetch(targetUrl, fetchOptions);

    // برگرداندن پاسخ مستقیم به کاربر (Netlify خودش استریمینگ را مدیریت می‌کند)
    return response;

  } catch (error) {
    console.error("Proxy Error:", error);
    return new Response("Bad Gateway: Connection Failed", { status: 502 });
  }
}
