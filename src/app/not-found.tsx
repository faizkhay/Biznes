import Link from "next/link";
import SearchBox from "@/components/SearchBox";

export default function NotFound() {
  return (
    <div className="shell pt-16 pb-16">
      <p className="label-1 text-ink-faint">Error 404</p>
      <h1 className="heading-1 mt-4">That page is not here.</h1>
      <p className="body-1 measure mt-4 text-ink-subtle">The address may be mistyped, or the listing may have been taken out. Search for what you were after, or start from the directory.</p>
      <div className="mt-8 max-w-xl">
        <SearchBox size="lg" id="missing-search" />
      </div>
      <p className="mt-6 flex flex-wrap gap-3">
        <Link href="/directory" className="btn btn-quiet button-md">
          The directory
        </Link>
        <Link href="/learn" className="btn btn-quiet button-md">
          The guides
        </Link>
      </p>
    </div>
  );
}
