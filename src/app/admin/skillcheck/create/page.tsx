import DraftAuthorMain from "@/app/skillcheck/draft/authoring/DraftAuthorMain";

export default function AdminDraftCreatePage() {
  return (
    <div className="max-w-6xl mx-auto p-8">
      <h1 className="text-3xl font-semibold text-white mb-8">
        Create Draft (Admin)
      </h1>

      <DraftAuthorMain
        initialStep="setup"
        submitUrl="/api/admin/skillcheck/draft/db"
        successMode="admin"
      />
    </div>
  );
}

