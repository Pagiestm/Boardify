import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/actions";

const WorkspaceIdPage = async () => {
    const user = await getCurrent()
    if (!user) redirect("/sign-in")

    return (
        <div>
            Workspace Id
        </div>
    );
}

export default WorkspaceIdPage;