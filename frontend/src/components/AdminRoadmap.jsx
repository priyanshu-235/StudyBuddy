import { useEffect, useState } from 'react';
import { NavLink } from 'react-router';
import axiosClient from '../utils/axiosClient';
import AlertBanner from './AlertBanner';
import { getErrorMessage } from '../utils/getErrorMessage';

function AdminRoadmap() {
  const [roadmap, setRoadmap] = useState(null);
  const [allProblems, setAllProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState('array');
  const [selectedProblemId, setSelectedProblemId] = useState('');
  const [editMeta, setEditMeta] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roadmapRes, problemsRes] = await Promise.all([
        axiosClient.get('/roadmap'),
        axiosClient.get('/problem/getAllProblem'),
      ]);
      setRoadmap(roadmapRes.data);
      setAllProblems(problemsRes.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err, 'Failed to load roadmap data'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const topic = roadmap?.topics.find((t) => t.topic === selectedTopic);
    if (topic) {
      setEditMeta({ title: topic.title, description: topic.description });
    }
  }, [roadmap, selectedTopic]);

  const activeTopic = roadmap?.topics.find((t) => t.topic === selectedTopic);

  const roadmapProblemIds = new Set(
    activeTopic?.problems.map((p) => p._id) || []
  );

  const availableProblems = allProblems.filter(
    (p) => !roadmapProblemIds.has(p._id)
  );

  const handleUpdateMeta = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      await axiosClient.put(`/roadmap/${selectedTopic}`, editMeta);
      await fetchData();
      setSuccessMessage('Topic updated successfully');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update topic'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddProblem = async (event) => {
    event.preventDefault();
    if (!selectedProblemId) return;

    try {
      setSubmitting(true);
      await axiosClient.post(`/roadmap/${selectedTopic}/problems`, {
        problemId: selectedProblemId,
      });
      setSelectedProblemId('');
      await fetchData();
      setSuccessMessage('Problem added to roadmap');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to add problem'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveProblem = async (problemId) => {
    if (!window.confirm('Remove this problem from the roadmap topic?')) return;

    try {
      await axiosClient.delete(`/roadmap/${selectedTopic}/problems/${problemId}`);
      await fetchData();
      setSuccessMessage('Problem removed from roadmap');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to remove problem'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Roadmap</h1>
          <p className="text-base-content/70 mt-1">Add, remove, and update problems per topic</p>
        </div>
        <div className="flex gap-2">
          <NavLink to="/roadmap" className="btn btn-ghost btn-sm">View Roadmap</NavLink>
          <NavLink to="/admin" className="btn btn-ghost btn-sm">Admin Panel</NavLink>
        </div>
      </div>

      <AlertBanner type="error" message={error} onDismiss={() => setError(null)} className="mb-4" />
      <AlertBanner type="success" message={successMessage} onDismiss={() => setSuccessMessage(null)} className="mb-4" />

      <div className="flex flex-wrap gap-2 mb-6">
        {roadmap?.topics.map((topic) => (
          <button
            key={topic.topic}
            type="button"
            onClick={() => setSelectedTopic(topic.topic)}
            className={`btn btn-sm ${selectedTopic === topic.topic ? 'btn-warning' : 'btn-ghost'}`}
          >
            {topic.title} ({topic.totalCount})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edit topic meta */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Topic Details</h2>
          <form onSubmit={handleUpdateMeta} className="space-y-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Title</span></label>
              <input
                className="input input-bordered"
                value={editMeta.title}
                onChange={(e) => setEditMeta({ ...editMeta, title: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Description</span></label>
              <textarea
                className="textarea textarea-bordered"
                rows={3}
                value={editMeta.description}
                onChange={(e) => setEditMeta({ ...editMeta, description: e.target.value })}
              />
            </div>
            <button type="submit" className="btn btn-warning" disabled={submitting}>
              {submitting ? 'Saving...' : 'Update Topic'}
            </button>
          </form>
        </div>

        {/* Add problem */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Add Problem to {activeTopic?.title}</h2>
          <form onSubmit={handleAddProblem} className="space-y-4">
            <select
              className="select select-bordered w-full"
              value={selectedProblemId}
              onChange={(e) => setSelectedProblemId(e.target.value)}
            >
              <option value="">Select a problem...</option>
              {availableProblems.map((problem) => (
                <option key={problem._id} value={problem._id}>
                  {problem.title} ({problem.difficulty} · {problem.tags})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="btn btn-success w-full"
              disabled={submitting || !selectedProblemId}
            >
              Add to Roadmap
            </button>
          </form>
        </div>
      </div>

      {/* Current problems in topic */}
      <div className="card bg-base-100 shadow-lg p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">
          Problems in {activeTopic?.title} ({activeTopic?.problems.length || 0})
        </h2>

        {activeTopic?.problems.length === 0 ? (
          <p className="text-base-content/60 italic">No problems in this topic yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Title</th>
                  <th>Difficulty</th>
                  <th>Tag</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeTopic.problems.map((problem, index) => (
                  <tr key={problem._id}>
                    <td>{index + 1}</td>
                    <td>{problem.title}</td>
                    <td>
                      <span className="badge badge-outline capitalize">{problem.difficulty}</span>
                    </td>
                    <td>
                      <span className="badge badge-outline">{problem.tags}</span>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveProblem(problem._id)}
                        className="btn btn-sm btn-error"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminRoadmap;
