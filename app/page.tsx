// ...existing code...

// 추천 알고리즘: 각 장소의 후기 신뢰도와 평점 평균을 계산하여 상위 2개 추천
type ScoredPlace = Place & { avgTrust: number; avgRating: number; score: number };

function getRecommendedPlaces(reviews: Record<number, Review[]>, places: Place[]): ScoredPlace[] {
  // 각 장소별 신뢰도 평균과 평점 평균 계산
  const scored: ScoredPlace[] = places.map(place => {
    const placeReviews = reviews[place.id] || [];
    const avgTrust = placeReviews.length > 0 ? placeReviews.reduce((sum, r) => sum + r.trustScore, 0) / placeReviews.length : 0;
    const avgRating = placeReviews.length > 0 ? placeReviews.reduce((sum, r) => sum + r.rating, 0) / placeReviews.length : 0;
    return {
      ...place,
      avgTrust,
      avgRating,
      score: avgTrust * 0.7 + avgRating * 20 * 0.3, // 신뢰도 70%, 평점 30% 가중치
    };
  });
  // 점수 기준 상위 2개 추천
  return scored.sort((a, b) => b.score - a.score).slice(0, 2);
}
import Image from "next/image";

// 장소 데이터 모델
interface Place {
  id: number;
  name: string;
  category: string;
  location: string;
  description: string;
  reviews: Review[];
}

// 후기 데이터 모델
interface Review {
  id: number;
  user: string;
  rating: number;
  text: string;
  photoUrl: string;
  trustScore: number; // 신뢰도 점수
}

// 샘플 데이터
const samplePlaces: Place[] = [
  {
    id: 1,
    name: "숨은카페",
    category: "카페",
    location: "서울 강남구",
    description: "조용하고 분위기 좋은 숨은 카페",
    reviews: [
      {
        id: 1,
        user: "userA",
        rating: 5,
        text: "직접 가보니 정말 조용하고 커피가 맛있어요!",
        photoUrl: "/file.svg",
        trustScore: 95,
      },
      {
        id: 2,
        user: "userB",
        rating: 4,
        text: "광고와 다르게 진짜 분위기가 좋아요.",
        photoUrl: "/globe.svg",
        trustScore: 90,
      },
    ],
  },
  {
    id: 2,
    name: "골목식당",
    category: "식당",
    location: "서울 마포구",
    description: "현지인 추천 골목식당",
    reviews: [
      {
        id: 3,
        user: "userC",
        rating: 5,
        text: "SNS에서 본 것보다 훨씬 맛있고 친절해요.",
        photoUrl: "/window.svg",
        trustScore: 92,
      },
    ],
  },
];

import React, { useState } from "react";
// ...existing code...

export default function Page() {
  // 후기 작성 폼 상태
  const [selectedPlaceId, setSelectedPlaceId] = useState<number>(samplePlaces[0].id);
  const [user, setUser] = useState("");
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [reviews, setReviews] = useState<Record<number, Review[]>>(() => {
    const initial: Record<number, Review[]> = {};
    samplePlaces.forEach(place => {
      initial[place.id] = place.reviews;
    });
    return initial;
  });

  // 후기 추가 핸들러
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text || !photoUrl) return;
    const newReview: Review = {
      id: Date.now(),
      user,
      rating,
      text,
      photoUrl,
      trustScore: 90, // 기본값
    };
    setReviews((prev: any) => ({
      ...prev,
      [selectedPlaceId]: [...prev[selectedPlaceId], newReview],
    }));
    setUser("");
    setRating(5);
    setText("");
    setPhotoUrl("");
  };

  // 추천 장소 계산
  const recommended = getRecommendedPlaces(reviews, samplePlaces);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-2xl font-bold mb-6">진정성 있는 장소 추천</h1>
      <div className="w-full max-w-2xl">
        {/* 추천 장소 섹션 */}
        <section className="border rounded-lg p-4 mb-8 bg-green-50">
          <h2 className="text-lg font-semibold mb-2 text-green-700">추천 장소 TOP 2</h2>
          {recommended.map(place => (
            <div key={place.id} className="mb-4">
              <h3 className="text-md font-bold">{place.name} <span className="text-xs text-gray-500">({place.category})</span></h3>
              <p className="text-gray-700">{place.location}</p>
              <p className="text-gray-600">{place.description}</p>
              <p className="text-xs mt-1">평균 신뢰도: {place.avgTrust.toFixed(1)} / 평균 평점: {place.avgRating.toFixed(1)}</p>
            </div>
          ))}
        </section>

        {/* 후기 작성 폼 */}
        <form onSubmit={handleAddReview} className="border rounded-lg p-4 mb-8 bg-gray-50">
          <h2 className="text-lg font-semibold mb-2">후기 작성</h2>
          <div className="mb-2">
            <label className="mr-2">장소 선택:</label>
            <select value={selectedPlaceId} onChange={e => setSelectedPlaceId(Number(e.target.value))} className="border p-1 rounded">
              {samplePlaces.map(place => (
                <option key={place.id} value={place.id}>{place.name}</option>
              ))}
            </select>
          </div>
          <div className="mb-2">
            <input type="text" placeholder="닉네임" value={user} onChange={e => setUser(e.target.value)} className="border p-1 rounded w-32 mr-2" />
            <input type="number" min={1} max={5} placeholder="평점(1~5)" value={rating} onChange={e => setRating(Number(e.target.value))} className="border p-1 rounded w-24 mr-2" />
          </div>
          <div className="mb-2">
            <input type="text" placeholder="사진 파일명 (예: file.svg)" value={photoUrl} onChange={e => setPhotoUrl(e.target.value)} className="border p-1 rounded w-48 mr-2" />
          </div>
          <div className="mb-2">
            <textarea placeholder="후기 내용" value={text} onChange={e => setText(e.target.value)} className="border p-1 rounded w-full" rows={2} />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">후기 등록</button>
        </form>

        {/* 장소 및 후기 리스트 */}
        {samplePlaces.map((place) => (
          <div key={place.id} className="border rounded-lg p-4 mb-6 bg-white shadow">
            <h2 className="text-xl font-semibold mb-2">{place.name} <span className="text-sm text-gray-500">({place.category})</span></h2>
            <p className="text-gray-700 mb-1">{place.location}</p>
            <p className="mb-2">{place.description}</p>
            <div className="mb-2">
              <strong>후기:</strong>
              {(reviews[place.id] || []).map((review: Review) => (
                <div key={review.id} className="border-t pt-2 mt-2">
                  <div className="flex items-center mb-1">
                    <img src={review.photoUrl} alt="후기 사진" className="w-10 h-10 rounded mr-2" />
                    <span className="font-medium">{review.user}</span>
                    <span className="ml-2 text-yellow-500">★ {review.rating}</span>
                    <span className="ml-2 text-green-600 text-xs">신뢰도: {review.trustScore}</span>
                  </div>
                  <p className="text-gray-800">{review.text}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
