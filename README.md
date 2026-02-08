# Blog.Answer.com (Starter Project)

একটি **ready-to-run starter blog project** যেখানে রেজিস্ট্রেশন, লগইন, প্রোফাইল, পোস্ট CRUD, কমেন্ট, লাইক এবং বেসিক অ্যাডমিন ভিউ রয়েছে (LocalStorage ভিত্তিক demo)।

## কী কী আছে

- ✅ User Registration & Login
- ✅ Profile Update (name, avatar, bio)
- ✅ Create/Edit/Delete Post
- ✅ Draft / Published status
- ✅ Public feed with Like + Comment
- ✅ Admin panel (user list + post monitoring)
- ✅ Responsive UI (mobile/tablet/desktop)

## টেক স্ট্যাক

- HTML5
- CSS3
- Vanilla JavaScript
- Browser LocalStorage (demo database)

## Quick Start

1. রিপো ক্লোন/ডাউনলোড করুন
2. `index.html` ব্রাউজারে ওপেন করুন
3. প্রথম রেজিস্টার করা ইউজার স্বয়ংক্রিয়ভাবে `admin` role পাবে
4. পোস্ট তৈরি করুন (draft/published)
5. Home tab থেকে published পোস্টে like/comment দিন

> এই ভার্সনটি MVP/demo. Production এর জন্য backend API, secure auth, hash password, DB, validation, এবং deployment pipeline যুক্ত করতে হবে।

## ফাইল স্ট্রাকচার

- `index.html` → UI layout ও sections
- `styles.css` → responsive styling
- `app.js` → app logic (auth, posts, comments, admin)

## Production Roadmap (Suggested)

- Password hashing + JWT ভিত্তিক auth
- REST API (Node.js/Django/PHP)
- MongoDB/MySQL/Firebase integration
- Rich text editor + image upload storage
- Moderation workflow + report handling
- SEO, analytics, and CI/CD deployment
